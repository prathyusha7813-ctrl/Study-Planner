import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Field from '../components/Field';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthForm({ mode, onSubmit }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (isRegister && !values.name.trim()) e.name = 'Name is required';
    if (!EMAIL.test(values.email.trim())) e.email = 'Enter a valid email';
    if (isRegister) {
      if (values.password.length < 8) e.password = 'At least 8 characters';
      else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) e.password = 'Include a letter and a number';
    } else if (!values.password) e.password = 'Password is required';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setFormError('');
    try {
      await onSubmit(isRegister ? values : { email: values.email, password: values.password });
      navigate('/', { replace: true });
    } catch (err) {
      setErrors(err.fieldErrors?.() || {});
      setFormError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/favicon.svg" alt="" width="40" height="40" />
          <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
          <p className="muted">{isRegister ? 'Start planning your study week.' : 'Log in to see what is due.'}</p>
        </div>
        <form className="form" onSubmit={submit} noValidate>
          {formError && <div className="alert">{formError}</div>}
          {isRegister && (
            <Field label="Name" htmlFor="name" error={errors.name}>
              <input id="name" autoComplete="name" value={values.name} onChange={set('name')} maxLength={60} />
            </Field>
          )}
          <Field label="Email" htmlFor="email" error={errors.email}>
            <input id="email" type="email" autoComplete="email" value={values.email} onChange={set('email')} />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password}>
            <input
              id="password"
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={values.password}
              onChange={set('password')}
              maxLength={72}
            />
          </Field>
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>
        <p className="auth-switch muted">
          {isRegister ? 'Already have an account? ' : 'New here? '}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link>
        </p>
      </div>
    </div>
  );
}
