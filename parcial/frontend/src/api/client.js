const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error en la petición a la API');
  }
  return response.json();
}

export const api = {
  register: (data) => apiFetch('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  login: (data) => apiFetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  getUserProfile: (id) => apiFetch(`/users/${id}`),

  getVideos: () => apiFetch('/videos'),
  getVideoById: (id) => apiFetch(`/videos/${id}`),
  createVideo: (formData) => apiFetch('/videos', {
    method: 'POST',
    body: formData
  }),
  updateVideo: (id, data) => apiFetch(`/videos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteVideo: (id) => apiFetch(`/videos/${id}`, { method: 'DELETE' }),

  getComments: (videoId) => apiFetch(`/videos/${videoId}/comments`),
  addComment: (videoId, data) => apiFetch(`/videos/${videoId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
};