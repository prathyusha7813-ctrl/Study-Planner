import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import useAsync from '../lib/useAsync';
import TaskItem from '../components/TaskItem';
import TaskForm from '../components/TaskForm';

const FILTER_KEYS = ['subject', 'priority', 'status', 'sort', 'order'];

export default function Tasks() {
  const [params, setParams] = useSearchParams();
  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || '']));
  const key = FILTER_KEYS.map((k) => filters[k]).join('|');

  const subjectsQ = useAsync(() => api.subjects().then((r) => r.subjects), []);
  const tasksQ = useAsync(() => api.tasks(filters).then((r) => r.tasks), [key]);
  const [editing, setEditing] = useState(null); // null | 'new' | task
  const [actionError, setActionError] = useState('');

  const subjects = subjectsQ.data || [];
  const tasks = tasksQ.data || [];

  const setFilter = (k) => (e) => {
    const next = new URLSearchParams(params);
    if (e.target.value) next.set(k, e.target.value);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  const run = async (fn) => {
    try {
      await fn();
      setActionError('');
      tasksQ.reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const onStatus = (task, status) => run(() => api.updateTask(task._id, { status }));
  const onDelete = (task) => {
    if (window.confirm(`Delete "${task.title}"?`)) run(() => api.deleteTask(task._id));
  };

  const activeFilters = ['subject', 'priority', 'status'].some((k) => filters[k]);
  const counts = tasks.reduce((acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }), {});

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Tasks</h1>
          <p className="muted">
            {tasks.length} task{tasks.length === 1 ? '' : 's'}
            {tasks.length > 0 && ` · ${counts.todo || 0} to do · ${counts.doing || 0} doing · ${counts.done || 0} done`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>+ New task</button>
      </div>

      <div className="toolbar card">
        <label>
          <span>Subject</span>
          <select value={filters.subject} onChange={setFilter('subject')}>
            <option value="">All subjects</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </label>
        <label>
          <span>Priority</span>
          <select value={filters.priority} onChange={setFilter('priority')}>
            <option value="">Any</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label>
          <span>Status</span>
          <select value={filters.status} onChange={setFilter('status')}>
            <option value="">Any</option>
            <option value="todo">To do</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
          </select>
        </label>
        <label>
          <span>Sort by</span>
          <select value={filters.sort} onChange={setFilter('sort')}>
            <option value="">Due date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
            <option value="createdAt">Date added</option>
          </select>
        </label>
        <label>
          <span>Order</span>
          <select value={filters.order} onChange={setFilter('order')}>
            <option value="">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
        {activeFilters && (
          <button className="btn btn-ghost btn-sm toolbar-clear" onClick={() => setParams({}, { replace: true })}>
            Clear filters
          </button>
        )}
      </div>

      {(actionError || tasksQ.error) && <div className="alert">{actionError || tasksQ.error.message}</div>}

      <section className="card">
        {tasksQ.loading && !tasksQ.data ? (
          <div className="center"><span className="spinner" aria-label="Loading" /></div>
        ) : tasks.length ? (
          <ul className={`task-list${tasksQ.loading ? ' is-loading' : ''}`}>
            {tasks.map((t) => (
              <TaskItem key={t._id} task={t} onStatus={onStatus} onEdit={setEditing} onDelete={onDelete} />
            ))}
          </ul>
        ) : (
          <div className="empty">
            <p className="muted">{activeFilters ? 'No tasks match these filters.' : 'No tasks yet.'}</p>
            {!activeFilters && <button className="btn btn-primary" onClick={() => setEditing('new')}>Add your first task</button>}
          </div>
        )}
      </section>

      {editing && (
        <TaskForm
          task={editing === 'new' ? null : editing}
          subjects={subjects}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); tasksQ.reload(); }}
        />
      )}
    </>
  );
}
