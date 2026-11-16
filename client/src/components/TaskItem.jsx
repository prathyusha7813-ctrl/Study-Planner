import { daysUntil, formatDue } from '../lib/dates';

const STATUS_LABEL = { todo: 'To do', doing: 'Doing', done: 'Done' };

export default function TaskItem({ task, onStatus, onEdit, onDelete, compact = false }) {
  const done = task.status === 'done';
  const overdue = !done && daysUntil(task.dueDate) < 0;

  return (
    <li className={`task${done ? ' is-done' : ''}`}>
      <input
        type="checkbox"
        className="task-check"
        checked={done}
        onChange={() => onStatus(task, done ? 'todo' : 'done')}
        aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
      />
      <div className="task-main">
        <span className="task-title">{task.title}</span>
        <div className="task-meta">
          {task.subject && (
            <span className="chip">
              <span className="dot" style={{ background: task.subject.color }} />
              {task.subject.name}
            </span>
          )}
          <span className={`due${overdue ? ' overdue' : ''}`}>{formatDue(task.dueDate)}</span>
          <span className={`badge p-${task.priority}`}>{task.priority}</span>
        </div>
      </div>
      {!compact && (
        <select
          className="status-select"
          value={task.status}
          onChange={(e) => onStatus(task, e.target.value)}
          aria-label={`Status of "${task.title}"`}
        >
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      )}
      {onEdit && (
        <div className="task-actions">
          <button className="icon-btn" onClick={() => onEdit(task)} aria-label={`Edit "${task.title}"`} title="Edit">✎</button>
          <button className="icon-btn danger" onClick={() => onDelete(task)} aria-label={`Delete "${task.title}"`} title="Delete">🗑</button>
        </div>
      )}
    </li>
  );
}
