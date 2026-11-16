const BASE = `${import.meta.env.VITE_API_URL || ''}/api`;

export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.status = status;
    this.details = details;
  }

  /** Map server validation details to { field: message } for forms. */
  fieldErrors() {
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]));
  }
}

async function request(path, { method = 'GET', body, query } = {}) {
  let url = `${BASE}${path}`;
  if (query) {
    const params = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== '' && v != null)
    );
    if ([...params].length) url += `?${params}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: 'include', // send the httpOnly auth cookie
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection.');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || res.statusText, data.details);
  return data;
}

export const api = {
  me: () => request('/auth/me'),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  register: (body) => request('/auth/register', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  dashboard: (date) => request('/dashboard', { query: { date } }),

  subjects: () => request('/subjects'),
  createSubject: (body) => request('/subjects', { method: 'POST', body }),
  updateSubject: (id, body) => request(`/subjects/${id}`, { method: 'PATCH', body }),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: 'DELETE' }),

  tasks: (query) => request('/tasks', { query }),
  createTask: (body) => request('/tasks', { method: 'POST', body }),
  updateTask: (id, body) => request(`/tasks/${id}`, { method: 'PATCH', body }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};
