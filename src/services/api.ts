// API Base URL (defaults to /api in production on Vercel, localhost in dev)
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

// Generic fetch wrapper
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  signup: (name: string, email: string, password: string) =>
    apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  verifyEmail: (otp: string) =>
    apiCall('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ otp }),
    }),

  resendOTP: () =>
    apiCall('/auth/resend-otp', {
      method: 'POST',
    }),

  forgotPassword: (email: string) =>
    apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    }),

  getMe: () => apiCall('/auth/me'),

  updateProfile: (data: any) =>
    apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  logout: () => apiCall('/auth/logout', { method: 'POST' }),
};

// Projects API
export const projectsAPI = {
  getAll: () => apiCall('/projects'),

  getOne: (id: string) => apiCall(`/projects/${id}`),

  create: (projectData: any) =>
    apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    }),

  update: (id: string, projectData: any) =>
    apiCall(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    }),

  delete: (id: string) =>
    apiCall(`/projects/${id}`, {
      method: 'DELETE',
    }),

  duplicate: (id: string) =>
    apiCall(`/projects/${id}/duplicate`, {
      method: 'POST',
    }),

  updateThumbnail: (id: string, thumbnail: string) =>
    apiCall(`/projects/${id}/thumbnail`, {
      method: 'PUT',
      body: JSON.stringify({ thumbnail }),
    }),

  incrementExport: (id: string) =>
    apiCall(`/projects/${id}/export`, {
      method: 'PUT',
    }),
};

export default { authAPI, projectsAPI };
