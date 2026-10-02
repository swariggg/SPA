const API_URL = "http://18.118.162.39:8000"; 

export const apiFetch = async (endpoint, options = {}) => {
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Error al comunicarse con el servidor");
  }

  return response.json();
};