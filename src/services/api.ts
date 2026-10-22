import { HealthResponse, Category, Video, AdultAccount } from '../types';

const API_BASE = '/api/v1';

export class ApiClient {
  private static token: string | null = null;

  public static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('kinvid_token', token);
    } else {
      localStorage.removeItem('kinvid_token');
    }
  }

  public static getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('kinvid_token');
    }
    return this.token;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    return data;
  }

  public static async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  public static async getCategories(): Promise<{ success: boolean; count: number; categories: Category[] }> {
    return this.request('/categories');
  }

  public static async getFeed(params?: { categoryId?: string; childProfileId?: string }): Promise<{
    success: boolean;
    videos: Video[];
    total: number;
  }> {
    const query = new URLSearchParams();
    if (params?.categoryId) query.set('categoryId', params.categoryId);
    if (params?.childProfileId) query.set('childProfileId', params.childProfileId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/videos/feed${qs}`);
  }

  public static async login(email: string, password: string): Promise<{ success: boolean; token: string; user: AdultAccount }> {
    const result = await this.request<{ success: boolean; token: string; user: AdultAccount }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(result.token);
    return result;
  }

  public static async getMe(): Promise<{ success: boolean; user: AdultAccount }> {
    return this.request('/auth/me');
  }

  public static async getAdminStats(): Promise<{ success: boolean; stats: unknown }> {
    return this.request('/admin/stats');
  }
}
