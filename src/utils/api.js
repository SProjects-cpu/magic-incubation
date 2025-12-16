// API client for backend communication with RBAC
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('authUser') || 'null');
  }

  // Set authentication data
  setAuth(token, user) {
    this.token = token;
    this.user = user;
    if (token && user) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
  }

  // Get current user
  getUser() {
    return this.user;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // Check if user has admin role
  isAdmin() {
    return this.user?.role === 'admin';
  }

  // Check if user has guest role
  isGuest() {
    return this.user?.role === 'guest';
  }

  // Get headers for API requests
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Get API base URL
  getBaseUrl() {
    return API_URL.replace('/api', '');
  }

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle 401 Unauthorized
        if (response.status === 401) {
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(username, password) {
    try {
      const data = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      
      this.setAuth(data.token, data.user);
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const user = await this.request('/auth/me');
      this.user = user;
      localStorage.setItem('authUser', JSON.stringify(user));
      return user;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  async updateAdminCredentials(currentPassword, newEmail, newPassword) {
    return this.request('/auth/update-admin-credentials', {
      method: 'PUT',
      body: JSON.stringify({ 
        currentPassword, 
        newEmail: newEmail || undefined, 
        newPassword: newPassword || undefined 
      })
    });
  }

  logout() {
    this.setAuth(null, null);
  }

  // Startup endpoints
  async getStartups(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/startups?${params}`);
  }

  async getStartup(id) {
    return this.request(`/startups/${id}`);
  }

  async createStartup(data) {
    return this.request('/startups', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateStartup(id, data) {
    return this.request(`/startups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteStartup(id) {
    return this.request(`/startups/${id}`, {
      method: 'DELETE'
    });
  }

  async addPitchHistory(id, pitch) {
    return this.request(`/startups/${id}/pitch`, {
      method: 'POST',
      body: JSON.stringify(pitch)
    });
  }

  async uploadDocument(id, file) {
    const formData = new FormData();
    formData.append('document', file);

    return this.request(`/startups/${id}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });
  }

  async getStartupStats() {
    return this.request('/startups/stats/overview');
  }

  // SMC endpoints
  async getSMCSchedules(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/smc?${params}`);
  }

  async createSMCSchedule(data) {
    return this.request('/smc', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async completeSMCSchedule(id, data) {
    return this.request(`/smc/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteSMCSchedule(id) {
    return this.request(`/smc/${id}`, {
      method: 'DELETE'
    });
  }

  // One-on-One endpoints
  async getOneOnOneSessions(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/one-on-one?${params}`);
  }

  async createOneOnOneSession(data) {
    return this.request('/one-on-one', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async completeOneOnOneSession(id, data) {
    return this.request(`/one-on-one/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteOneOnOneSession(id) {
    return this.request(`/one-on-one/${id}`, {
      method: 'DELETE'
    });
  }

  // Guest endpoints
  async getGuests() {
    return this.request('/guests');
  }

  async createGuest(data) {
    return this.request('/guests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateGuest(id, data) {
    return this.request(`/guests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteGuest(id) {
    return this.request(`/guests/${id}`, {
      method: 'DELETE'
    });
  }

  // Settings endpoints
  async getSettings() {
    return this.request('/settings');
  }

  async getSetting(key) {
    return this.request(`/settings/${key}`);
  }

  async updateSetting(key, value, description) {
    return this.request(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value, description })
    });
  }

  // Landing page endpoints
  async getLandingPage() {
    return this.request('/landing-page');
  }

  async updateLandingPage(data) {
    return this.request('/landing-page', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Achievement endpoints
  async addAchievement(startupId, achievement) {
    return this.request(`/achievements/${startupId}`, {
      method: 'POST',
      body: JSON.stringify(achievement)
    });
  }

  async deleteAchievement(startupId, achievementId) {
    return this.request(`/achievements/${startupId}/${achievementId}`, {
      method: 'DELETE'
    });
  }

  // Migration endpoints
  async getMigrationStatus() {
    return this.request('/migration/status');
  }

  async migrateLocalStorage(localData) {
    return this.request('/migration/migrate-localstorage', {
      method: 'POST',
      body: JSON.stringify(localData)
    });
  }
}

export const api = new ApiClient();
