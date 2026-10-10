// ============================================================
// ElderCare Frontend API Client
// Handles communication with Express backend & MySQL Database
// ============================================================

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  let userRole = null;
  let caregiverName = null;
  let residentId = null;
  let doctorName = null;
  let doctorId = null;
  let authToken = null;
  try {
    const raw = typeof window !== 'undefined'
      ? (localStorage.getItem('eldercare_session') || sessionStorage.getItem('eldercare_session'))
      : null;
    authToken = typeof window !== 'undefined'
      ? (localStorage.getItem('eldercare_jwt_token') || sessionStorage.getItem('eldercare_jwt_token'))
      : null;
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.role) userRole = u.role;
      if (u?.caregiverName || u?.name) caregiverName = u.caregiverName || u.name;
      if (u?.residentId) residentId = u.residentId;
      if (u?.doctorId || u?.id) doctorId = u.doctorId || u.id;
      if (u?.doctorName || (u?.role === 'doctor' && u?.name)) doctorName = u.doctorName || u.name;
      if (u?.token && !authToken) authToken = u.token;
    }
  } catch {}

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      ...(userRole ? { 'x-user-role': userRole } : {}),
      ...(caregiverName ? { 'x-user-caregiver-name': caregiverName } : {}),
      ...(residentId ? { 'x-user-resident-id': residentId } : {}),
      ...(doctorName ? { 'x-user-doctor-name': doctorName } : {}),
      ...(doctorId ? { 'x-user-doctor-id': doctorId } : {}),
      ...options.headers
    },
    ...options
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || `Request failed with status ${res.status}`);
      err.data = data;
      err.code = data.code;
      err.status = res.status;
      throw err;
    }
    return data;
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err);
    throw err;
  }
}

export const healthApi = {
  check: () => request('/health-check'),
};

export const authApi = {
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),
  googleLogin: (payload) => request('/auth/google', { method: 'POST', body: payload }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  resetPassword: (identifier, newPassword) => request('/auth/reset-password', { method: 'POST', body: { identifier, newPassword } }),
  getMe: () => request('/auth/me'),
  verifyToken: () => request('/auth/verify-token'),
  findUser: (identifier) => request(`/auth/find-user?identifier=${encodeURIComponent(identifier)}`),
  updateProfile: (payload) => request('/auth/profile', { method: 'PUT', body: payload }),
};

export const apiDocsApi = {
  getCatalog: () => request('/docs'),
};

export const residentsApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/residents${q ? `?${q}` : ''}`);
  },
  getById: (id) => request(`/residents/${id}`),
  create: (data) => request('/residents', { method: 'POST', body: data }),
  update: (id, data) => request(`/residents/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/residents/${id}`, { method: 'DELETE' }),
};

export const caregiversApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/caregivers${q ? `?${q}` : ''}`);
  },
  create: (data) => request('/caregivers', { method: 'POST', body: data }),
  update: (id, data) => request(`/caregivers/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/caregivers/${id}`, { method: 'DELETE' }),
};

export const medicationsApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/medications${q ? `?${q}` : ''}`);
  },
  create: (data) => request('/medications', { method: 'POST', body: data }),
  updateStatus: (id, status) => request(`/medications/${id}/status`, { method: 'PATCH', body: { status } }),
  delete: (id) => request(`/medications/${id}`, { method: 'DELETE' }),
};

export const appointmentsApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/appointments${q ? `?${q}` : ''}`);
  },
  create: (data) => request('/appointments', { method: 'POST', body: data }),
  updateStatus: (id, status) => request(`/appointments/${id}/status`, { method: 'PATCH', body: { status } }),
  delete: (id) => request(`/appointments/${id}`, { method: 'DELETE' }),
};

export const carePlansApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/care-plans${q ? `?${q}` : ''}`);
  },
  create: (data) => request('/care-plans', { method: 'POST', body: data }),
  toggleTask: (id, taskLabel) => request(`/care-plans/${id}/task`, { method: 'PATCH', body: { taskLabel } }),
  delete: (id) => request(`/care-plans/${id}`, { method: 'DELETE' }),
};

export const emergencyApi = {
  getAll: () => request('/emergency'),
  getMappings: () => request('/emergency/mappings'),
  getSpecialists: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/emergency/specialists${q ? `?${q}` : ''}`);
  },
  trigger: (details) => request('/emergency/trigger', { method: 'POST', body: details }),
  respond: (id, responderName) => request(`/emergency/${id}/respond`, { method: 'POST', body: { responderName } }),
  resolve: (id, resolutionNotes) => request(`/emergency/${id}/resolve`, { method: 'POST', body: { resolutionNotes } }),
  delete: (id) => request(`/emergency/${id}`, { method: 'DELETE' }),
};

export const specialistsApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/specialists${q ? `?${q}` : ''}`);
  },
  getDoctorDashboard: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/specialists/doctor-dashboard${q ? `?${q}` : ''}`);
  },
  getMappings: () => request('/emergency/mappings'),
  getAvailability: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/specialists/availability${q ? `?${q}` : ''}`);
  },
  getDoctorAvailability: (doctorId) => request(`/specialists/${doctorId}/availability`),
  getSlots: (doctorId, date) => {
    const q = date ? `?date=${encodeURIComponent(date)}` : '';
    return request(`/specialists/${doctorId}/slots${q}`);
  },
  getWeekView: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/specialists/week-view${q ? `?${q}` : ''}`);
  },
  addAvailability: (data) => request('/specialists/availability', { method: 'POST', body: data }),
  updateAvailability: (id, data) => request(`/specialists/availability/${id}`, { method: 'PATCH', body: data }),
  deleteAvailability: (id) => request(`/specialists/availability/${id}`, { method: 'DELETE' }),
};

export const vitalsApi = {
  getOverview: () => request('/health/overview'),
  getVitals: (residentId) => request(`/health/${residentId}`),
  recordVitals: (residentId, data) => request(`/health/${residentId}`, { method: 'POST', body: data }),
};

export const careRecordsApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/health/records${q ? `?${q}` : ''}`);
  },
  getByResident: (residentId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/health/records/${residentId}${q ? `?${q}` : ''}`);
  },
  create: (data) => request('/health/records', { method: 'POST', body: data }),
  delete: (recordId) => request(`/health/records/${recordId}`, { method: 'DELETE' }),
};

export const activitiesApi = {
  getAll: () => request('/activities'),
  create: (data) => request('/activities', { method: 'POST', body: data }),
};

export const documentsApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/documents${q ? `?${q}` : ''}`);
  },
  create: (data) => request('/documents', { method: 'POST', body: data }),
};

export const notificationsApi = {
  getAll: () => request('/notifications'),
  create: (data) => request('/notifications', { method: 'POST', body: data }),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),
  delete: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
};

export const settingsApi = {
  get: (userId) => request(`/settings/${userId}`),
  update: (userId, data) => request(`/settings/${userId}`, { method: 'PUT', body: data }),
};

export const chatbotApi = {
  sendMessage: (message, user, lang, history) => request('/chatbot', { method: 'POST', body: { message, user, lang, history } }),
};

export const careDependencyMapApi = {
  getByResident: (residentId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/care-dependency-map/${residentId}${q ? `?${q}` : ''}`);
  },
};

export const voicemailsApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/voicemails${q ? `?${q}` : ''}`);
  },
  create: (data) => request('/voicemails', { method: 'POST', body: data }),
  markRead: (id) => request(`/voicemails/${id}/read`, { method: 'PATCH' }),
  delete: (id) => request(`/voicemails/${id}`, { method: 'DELETE' }),
};

export const communicationApi = {
  getConversations: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/communication/conversations${q ? `?${q}` : ''}`);
  },
  getMessages: (phone) => request(`/communication/messages?phone=${encodeURIComponent(phone)}`),
  sendMessage: (data) => request('/communication/messages', { method: 'POST', body: data }),
  getEmergencyLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/communication/emergency-logs${q ? `?${q}` : ''}`);
  },
  dispatchEmergency: (data) => request('/communication/emergency-dispatch', { method: 'POST', body: data }),
  sendWhatsApp: (data) => request('/communication/whatsapp', { method: 'POST', body: data }),
  makeVoiceCall: (data) => request('/communication/voice', { method: 'POST', body: data }),
};

export default {
  healthApi,
  authApi,
  residentsApi,
  caregiversApi,
  medicationsApi,
  appointmentsApi,
  carePlansApi,
  emergencyApi,
  vitalsApi,
  careRecordsApi,
  activitiesApi,
  documentsApi,
  notificationsApi,
  settingsApi,
  chatbotApi,
  careDependencyMapApi,
  voicemailsApi,
  communicationApi
};
