const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class APIClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  setToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  removeToken() {
    localStorage.removeItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}

export const api = new APIClient();

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authAPI = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    api.setToken(response.token);
    return response;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    api.removeToken();
  },

  async me(): Promise<{ user: User }> {
    return api.get('/auth/me');
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },
};

export const usersAPI = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const popsAPI = {
  getAll: () => api.get<any[]>('/pops'),
  getById: (id: string) => api.get(`/pops/${id}`),
  create: (data: any) => api.post('/pops', data),
  update: (id: string, data: any) => api.put(`/pops/${id}`, data),
  delete: (id: string) => api.delete(`/pops/${id}`),
};

export const equipmentsAPI = {
  getAll: () => api.get<any[]>('/equipments'),
  getById: (id: string) => api.get(`/equipments/${id}`),
  create: (data: any) => api.post('/equipments', data),
  update: (id: string, data: any) => api.put(`/equipments/${id}`, data),
  delete: (id: string) => api.delete(`/equipments/${id}`),
};

export const interfacesAPI = {
  getAll: () => api.get<any[]>('/interfaces'),
  create: (data: any) => api.post('/interfaces', data),
  update: (id: string, data: any) => api.put(`/interfaces/${id}`, data),
  delete: (id: string) => api.delete(`/interfaces/${id}`),
};

export const vlansAPI = {
  getAll: () => api.get<any[]>('/vlans'),
  create: (data: any) => api.post('/vlans', data),
  update: (id: string, data: any) => api.put(`/vlans/${id}`, data),
  delete: (id: string) => api.delete(`/vlans/${id}`),
};

export const ipamAPI = {
  getSubnets: () => api.get<any[]>('/ipam/subnets'),
  createSubnet: (data: any) => api.post('/ipam/subnets', data),
  deleteSubnet: (id: string) => api.delete(`/ipam/subnets/${id}`),
  getAllocations: () => api.get<any[]>('/ipam/allocations'),
  createAllocation: (data: any) => api.post('/ipam/allocations', data),
  deleteAllocation: (id: string) => api.delete(`/ipam/allocations/${id}`),
};

export const circuitsAPI = {
  getAll: () => api.get<any[]>('/circuits'),
  create: (data: any) => api.post('/circuits', data),
  update: (id: string, data: any) => api.put(`/circuits/${id}`, data),
  delete: (id: string) => api.delete(`/circuits/${id}`),
};

export const servicesAPI = {
  getAll: () => api.get<any[]>('/services'),
  create: (data: any) => api.post('/services', data),
  update: (id: string, data: any) => api.put(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
};

export const runbooksAPI = {
  getAll: () => api.get<any[]>('/runbooks'),
  create: (data: any) => api.post('/runbooks', data),
  update: (id: string, data: any) => api.put(`/runbooks/${id}`, data),
  delete: (id: string) => api.delete(`/runbooks/${id}`),
};

export const checklistsAPI = {
  getAll: () => api.get<any[]>('/checklists'),
  getItems: (id: string) => api.get<any[]>(`/checklists/${id}/items`),
  create: (data: any) => api.post('/checklists', data),
  createItem: (id: string, data: any) => api.post(`/checklists/${id}/items`, data),
  updateItem: (id: string, data: any) => api.put(`/checklists/items/${id}`, data),
  delete: (id: string) => api.delete(`/checklists/${id}`),
};

export const auditAPI = {
  getLogs: (limit = 100, offset = 0) => api.get(`/audit?limit=${limit}&offset=${offset}`),
  getStats: () => api.get('/audit/stats'),
};

export const monitoringAPI = {
  getConfigs: () => api.get<any[]>('/monitoring/configs'),
  getStatus: () => api.get<any[]>('/monitoring/status'),
  createConfig: (data: any) => api.post('/monitoring/configs', data),
  acknowledge: (statusId: string, notes: string) => api.post(`/monitoring/acknowledge/${statusId}`, { notes }),
  deleteConfig: (id: string) => api.delete(`/monitoring/configs/${id}`),
};
