const API_BASE = '/api/v1';

export class ApiService {
  private static getToken(): string | null {
    return localStorage.getItem('dms_token');
  }

  private static getWorkspaceId(): string | null {
    return localStorage.getItem('dms_active_workspace_id');
  }

  static async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    const token = this.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const workspaceId = this.getWorkspaceId();
    if (workspaceId) {
      headers.set('x-workspace-id', workspaceId);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data.data;
  }

  static get<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static post<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  static patch<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  static delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
