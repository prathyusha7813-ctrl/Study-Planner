import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import useAsync from '../lib/useAsync';
import Field from '../components/Field';

const PALETTE = ['#4f46e5', '#0891b2', '#059669', '#ca8a04', '#ea580c', '#dc2626', '#db2777', '#7c3aed'];

function SubjectForm({ initial, onSubmit, onCancel, submitLabel }) {
  const [name, setName] = useState(initial?.name || '');
  const [color, setColor] = useState(initial?.color || PALETTE[0]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required');
    setBusy(true);
    try {
      await onSubmit({ name: name.trim(), color });
      if (!initial) { setName(''); setColor(PALETTE[0]); }
      setError('');
    } catch (err) {
      setError(err.fieldErrors?.().name || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="subject-form" onSubmit={submit} noValidate>
      <Field label="Subject name" htmlFor={`sn-${initial?._id || 'new'}`} error={error}>
        <input id={`sn-${initial?._id || 'new'}`} value={name} onChange={(e) => setName(e.target.value)} maxLength={50} placeholder="e.g. Chemistry" />
      </Field>
      <fieldset className="swatches">
        <legend>Color</legend>
        {PALETTE.map((c) => (
          <label key={c} className="swatch" style={{ '--swatch': c }}>
            <input type="radio" name={`color-${initial?._id || 'new'}`} value={c} checked={color === c} onChange={() => setColor(c)} />
            <span className="sr-only">{c}</span>
          </label>
        ))}
      </fieldset>
      <div className="form-actions">
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
        <button className="btn btn-primary" disabled={busy}>{submitLabel}</button>
      </div>
    </form>
  );
}

export default function Subjects() {
  const { data, error, loading, reload } = useAsync(
    () => Promise.all([api.subjects(), api.dashboard()]).then(([s, d]) => ({
      subjects: s.subjects,
      progress: Object.fromEntries(d.progress.map((p) => [p.subject._id, p])),
    })),
    []
  );
  const [editingId, setEditingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const remove = async (s) => {
    const count = data.progress[s._id]?.total || 0;
    const msg = count ? `Delete "${s.name}" and its ${count} task${count === 1 ? '' : 's'}?` : `Delete "${s.name}"?`;
    if (!window.confirm(msg)) return;
    try {
      await api.deleteSubject(s._id);
      setActionError('');
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (loading && !data) return <div className="center"><span className="spinner" aria-label="Loading" /></div>;
  if (error && !data) return <div className="alert">{error.message}</div>;

  return (
    <>
      <div className="page-head"><h1>Subjects</h1></div>
      {actionError && <div className="alert">{actionError}</div>}

      <section className="card">
        <h2>Add a subject</h2>
        <SubjectForm submitLabel="Add subject" onSubmit={async (v) => { await api.createSubject(v); reload(); }} />
      </section>

      <section className="card">
        <h2>Your subjects</h2>
        {data.subjects.length ? (
          <ul className="subject-list">
            {data.subjects.map((s) => {
              const p = data.progress[s._id];
              return (
                <li key={s._id} className="subject-item">
                  {editingId === s._id ? (
                    <SubjectForm
                      initial={s}
                      submitLabel="Save"
                      onCancel={() => setEditingId(null)}
                      onSubmit={async (v) => { await api.updateSubject(s._id, v); setEditingId(null); reload(); }}
                    />
                  ) : (
                    <>
                      <span className="dot dot-lg" style={{ background: s.color }} />
                      <div className="subject-main">
                        <Link to={`/tasks?subject=${s._id}`} className="subject-name">{s.name}</Link>
                        <span className="muted small">{p ? `${p.done}/${p.total} tasks done` : 'No tasks'}</span>
                      </div>
                      <div className="task-actions">
                        <button className="icon-btn" onClick={() => setEditingId(s._id)} aria-label={`Edit ${s.name}`} title="Edit">✎</button>
                        <button className="icon-btn danger" onClick={() => remove(s)} aria-label={`Delete ${s.name}`} title="Delete">🗑</button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty-line muted">No subjects yet — add one above.</p>
        )}
      </section>
    </>
  );
}
