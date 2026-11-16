const request = require('supertest');
const db = require('./setup');
require('../src/models/User');
require('../src/models/Subject');
require('../src/models/Task');
const createApp = require('../src/app');

const app = createApp();
const alice = { name: 'Alice', email: 'alice@example.com', password: 'password123' };
const bob = { name: 'Bob', email: 'bob@example.com', password: 'password456' };

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.disconnect);

// Register a user and return a supertest agent that keeps the auth cookie.
async function signedInAgent(user) {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send(user).expect(201);
  return agent;
}

describe('Study Planner API', () => {
  test('register sets an httpOnly cookie and never returns the password hash', async () => {
    const res = await request(app).post('/api/auth/register').send(alice).expect(201);

    expect(res.body.user).toMatchObject({ name: 'Alice', email: 'alice@example.com' });
    expect(res.body.user.password).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/); // no bcrypt hash anywhere

    const cookie = res.headers['set-cookie'].join(';');
    expect(cookie).toMatch(/token=/);
    expect(cookie).toMatch(/HttpOnly/i);

    // Duplicate email is a conflict
    await request(app).post('/api/auth/register').send(alice).expect(409);
  });

  test('register and login reject invalid input with 400 and wrong credentials with 401', async () => {
    const bad = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: 'not-an-email', password: 'short' })
      .expect(400);
    const fields = bad.body.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));

    await request(app).post('/api/auth/register').send(alice).expect(201);
    await request(app).post('/api/auth/login').send({ ...alice, password: 'wrongpass1' }).expect(401);

    const ok = await request(app).post('/api/auth/login').send(alice).expect(200);
    expect(ok.body.user.password).toBeUndefined();
  });

  test('protected routes return 401 without a valid session, and logout clears it', async () => {
    await request(app).get('/api/tasks').expect(401);
    await request(app).get('/api/dashboard').expect(401);
    await request(app).get('/api/auth/me').set('Cookie', 'token=garbage').expect(401);

    const agent = await signedInAgent(alice);
    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.user.email).toBe(alice.email);

    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });

  test('task CRUD with validation, filtering and sorting', async () => {
    const agent = await signedInAgent(alice);
    const { body: { subject: math } } = await agent.post('/api/subjects').send({ name: 'Math' }).expect(201);
    const { body: { subject: bio } } = await agent.post('/api/subjects').send({ name: 'Biology' }).expect(201);

    // Validation: bad date, bad priority, missing title
    const invalid = await agent
      .post('/api/tasks')
      .send({ subject: math._id, dueDate: '2026-02-30', priority: 'urgent' })
      .expect(400);
    expect(invalid.body.details.map((d) => d.field)).toEqual(
      expect.arrayContaining(['title', 'dueDate', 'priority'])
    );

    const created = await agent
      .post('/api/tasks')
      .send({ title: 'Algebra worksheet', subject: math._id, dueDate: '2026-11-20', priority: 'low' })
      .expect(201);
    expect(created.body.task).toMatchObject({ title: 'Algebra worksheet', status: 'todo', priority: 'low' });
    expect(created.body.task.subject.name).toBe('Math');
    const id = created.body.task._id;

    await agent.post('/api/tasks')
      .send({ title: 'Cell diagram', subject: bio._id, dueDate: '2026-11-18', priority: 'high' })
      .expect(201);
    await agent.post('/api/tasks')
      .send({ title: 'Calculus quiz prep', subject: math._id, dueDate: '2026-11-25', priority: 'high' })
      .expect(201);

    // Filter by subject, default sort by due date
    const mathTasks = await agent.get(`/api/tasks?subject=${math._id}`).expect(200);
    expect(mathTasks.body.tasks.map((t) => t.title)).toEqual(['Algebra worksheet', 'Calculus quiz prep']);

    // Sort by priority desc (high before low, then due date)
    const byPriority = await agent.get('/api/tasks?sort=priority&order=desc').expect(200);
    expect(byPriority.body.tasks.map((t) => t.priority)).toEqual(['high', 'high', 'low']);
    expect(byPriority.body.tasks[0].title).toBe('Cell diagram');

    await agent.get('/api/tasks?priority=critical').expect(400);

    // Update, then delete
    const updated = await agent.patch(`/api/tasks/${id}`).send({ status: 'done' }).expect(200);
    expect(updated.body.task.status).toBe('done');
    await agent.patch(`/api/tasks/${id}`).send({ status: 'finished' }).expect(400);
    await agent.delete(`/api/tasks/${id}`).expect(204);
    await agent.get(`/api/tasks/${id}`).expect(404);
    await agent.get('/api/tasks/not-an-id').expect(400);
  });

  test("users cannot see or modify each other's data; dashboard reports today, overdue and progress", async () => {
    const a = await signedInAgent(alice);
    const b = await signedInAgent(bob);

    const { body: { subject } } = await a.post('/api/subjects').send({ name: 'History' }).expect(201);
    const mk = (title, dueDate, status = 'todo') =>
      a.post('/api/tasks').send({ title, subject: subject._id, dueDate, status }).expect(201);
    const { body: { task } } = await mk('Read chapter 4', '2026-11-16');
    await mk('Essay outline', '2026-11-10');
    await mk('Old quiz', '2026-11-01', 'done');
    await mk('Timeline', '2026-11-30');

    // Bob sees nothing of Alice's and can't touch it
    expect((await b.get('/api/tasks').expect(200)).body.tasks).toHaveLength(0);
    await b.get(`/api/tasks/${task._id}`).expect(404);
    await b.patch(`/api/tasks/${task._id}`).send({ status: 'done' }).expect(404);
    await b.delete(`/api/subjects/${subject._id}`).expect(404);
    // ...nor attach his task to her subject
    await b.post('/api/tasks').send({ title: 'x', subject: subject._id, dueDate: '2026-11-16' }).expect(400);

    const dash = await a.get('/api/dashboard?date=2026-11-16').expect(200);
    expect(dash.body.today.map((t) => t.title)).toEqual(['Read chapter 4']);
    expect(dash.body.overdue.map((t) => t.title)).toEqual(['Essay outline']); // done tasks aren't overdue
    expect(dash.body.progress).toEqual([
      expect.objectContaining({ total: 4, done: 1, percent: 25 }),
    ]);
    await a.get('/api/dashboard?date=yesterday').expect(400);
  });
});
