const API_BASE = '/api';

// Collection endpoints may return a bare array or a paginated envelope.
export function collectionItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    for (const key of ['items', 'data', 'results', 'rows']) {
      if (Array.isArray(payload[key])) return payload[key];
    }
  }
  return [];
}

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: getHeaders(),
  });
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request('/auth/me'),

  // Generic CRUD
  getAll: async (resource) => collectionItems(await request(`/${resource}`)),
  getOne: (resource, id) => request(`/${resource}/${id}`),
  create: (resource, data) =>
    request(`/${resource}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (resource, id, data) =>
    request(`/${resource}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (resource, id) =>
    request(`/${resource}/${id}`, { method: 'DELETE' }),
  aiAnalyze: (resource, id) =>
    request(`/${resource}/${id}/ai-analyze`, { method: 'POST' }),
};
