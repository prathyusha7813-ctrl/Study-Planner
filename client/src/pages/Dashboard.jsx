import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { localYmd } from '../lib/dates';
import useAsync from '../lib/useAsync';
import { useAuth } from '../context/AuthContext';
import ProgressBar from '../components/ProgressBar';
import TaskItem from '../components/TaskItem';
import TaskForm from '../components/TaskForm';

export default function Dashboard() {
  const { user } = useAuth();
  const today = localYmd();
  const { data, error, loading, reload } = useAsync(
    () => Promise.all([api.dashboard(today), api.subjects()]),
    [today]
  );
  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState('');

  const onStatus = async (task, status) => {
    try {
      await api.updateTask(task._id, { status });
      setActionError('');
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (loading && !data) return <div className="center"><span className="spinner" aria-label="Loading" /></div>;
  if (error && !data) return <div className="alert">{error.message}</div>;

  const [dash, { subjects }] = data;
  const overallPct = dash.totals.total ? Math.round((dash.totals.done / dash.totals.total) * 100) : 0;
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <>
      <div className="page-head">
        <div>
          <p className="muted eyebrow">{dateLabel}</p>
          <h1>Hi, {user.name.split(' ')[0]}</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>+ New task</button>
      </div>
      {actionError && <div className="alert">{actionError}</div>}

      <section className="stats">
        <div className="stat"><span className="stat-num">{dash.today.length}</span><span className="muted">due today</span></div>
        <div className={`stat${dash.overdue.length ? ' stat-warn' : ''}`}><span className="stat-num">{dash.overdue.length}</span><span className="muted">overdue</span></div>
        <div className="stat"><span className="stat-num">{overallPct}%</span><span className="muted">{dash.totals.done} of {dash.totals.total} done</span></div>
      </section>

      <div className="grid-2">
        <section className="card">
          <h2>Today</h2>
          {dash.today.length ? (
            <ul className="task-list">
              {dash.today.map((t) => <TaskItem key={t._id} task={t} onStatus={onStatus} compact />)}
            </ul>
          ) : (
            <p className="empty-line muted">Nothing due today. 🎉</p>
          )}
        </section>

        <section className="card">
          <h2>Overdue</h2>
          {dash.overdue.length ? (
            <ul className="task-list">
              {dash.overdue.map((t) => <TaskItem key={t._id} task={t} onStatus={onStatus} compact />)}
            </ul>
          ) : (
            <p className="empty-line muted">You're all caught up.</p>
          )}
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Progress by subject</h2>
          <Link to="/subjects" className="link-sm">Manage subjects</Link>
        </div>
        {dash.progress.length ? (
          <ul className="progress-list">
            {dash.progress.map((p) => (
              <li key={p.subject._id}>
                <div className="progress-label">
                  <Link to={`/tasks?subject=${p.subject._id}`} className="chip chip-link">
                    <span className="dot" style={{ background: p.subject.color }} />
                    {p.subject.name}
                  </Link>
                  <span className="muted">{p.done}/{p.total} · {p.percent}%</span>
                </div>
                <ProgressBar percent={p.percent} color={p.subject.color} label={`${p.subject.name} progress`} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty">
            <p className="muted">Add your first subject to start tracking progress.</p>
            <Link to="/subjects" className="btn btn-primary">Add a subject</Link>
          </div>
        )}
      </section>

      {adding && (
        <TaskForm subjects={subjects} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); reload(); }} />
      )}
    </>
  );
}
