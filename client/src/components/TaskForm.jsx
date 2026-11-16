import { useState } from 'react';
import { Link } from 'react-router-dom';
import Field from './Field';
import Modal from './Modal';
import { api } from '../lib/api';
import { isoToYmd, localYmd } from '../lib/dates';

const empty = (subjects) => ({
  title: '',
  subject: subjects[0]?._id || '',
  dueDate: localYmd(),
  priority: 'medium',
  status: 'todo',
});

function validate(v) {
  const e = {};
  if (!v.title.trim()) e.title = 'Title is required';
  else if (v.title.trim().length > 120) e.title = 'Keep it under 120 characters';
  if (!v.subject) e.subject = 'Choose a subject';
  if (!v.dueDate) e.dueDate = 'Pick a due date';
  return e;
}

export default function TaskForm({ task, subjects, onClose, onSaved }) {
  const [values, setValues] = useState(() =>
    task
      ? { title: task.title, subject: task.subject?._id || '', dueDate: isoToYmd(task.dueDate), priority: task.priority, status: task.status }
      : empty(subjects)
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    setFormError('');
    const body = { ...values, title: values.title.trim() };
    try {
      const { task: saved } = task ? await api.updateTask(task._id, body) : await api.createTask(body);
      onSaved(saved);
    } catch (err) {
      setErrors(err.fieldErrors?.() || {});
      setFormError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose}>
      {subjects.length === 0 ? (
        <div className="empty">
          <p>You need a subject before adding tasks.</p>
          <Link className="btn btn-primary" to="/subjects" onClick={onClose}>Create a subject</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="form">
          {formError && <div className="alert">{formError}</div>}
          <Field label="Title" htmlFor="t-title" error={errors.title}>
            <input id="t-title" value={values.title} onChange={set('title')} maxLength={120} autoFocus placeholder="e.g. Revise chapter 3" />
          </Field>
          <div className="form-row">
            <Field label="Subject" htmlFor="t-subject" error={errors.subject}>
              <select id="t-subject" value={values.subject} onChange={set('subject')}>
                {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Due date" htmlFor="t-due" error={errors.dueDate}>
              <input id="t-due" type="date" value={values.dueDate} onChange={set('dueDate')} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Priority" htmlFor="t-priority" error={errors.priority}>
              <select id="t-priority" value={values.priority} onChange={set('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Field>
            <Field label="Status" htmlFor="t-status" error={errors.status}>
              <select id="t-status" value={values.status} onChange={set('status')}>
                <option value="todo">To do</option>
                <option value="doing">Doing</option>
                <option value="done">Done</option>
              </select>
            </Field>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : task ? 'Save changes' : 'Add task'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
