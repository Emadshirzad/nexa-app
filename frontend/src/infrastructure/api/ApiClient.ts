export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: any
  ) {
    super(`API Error ${status} (${statusText}): ${typeof data === 'string' ? data : JSON.stringify(data)}`);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private static instance: ApiClient | null = null;
  private readonly baseUrl: string;

  private constructor() {
    this.baseUrl = this.resolveBaseUrl();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private resolveBaseUrl(): string {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
      if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
        return envUrl.replace(/\/$/, '');
      }
      if (typeof window !== 'undefined' && window.location.port && !['80', '8080', ''].includes(window.location.port)) {
        return `http://${window.location.hostname}:8080${envUrl.startsWith('/') ? '' : '/'}${envUrl}`.replace(/\/$/, '');
      }
      return envUrl.replace(/\/$/, '');
    }

    if (typeof window !== 'undefined' && window.location.port && !['80', '8080', ''].includes(window.location.port)) {
      return `http://${window.location.hostname}:8080/api/v1`;
    }

    return '/api/v1';
  }

  public async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>(url, { method: 'GET' });
  }

  public async post<T>(path: string, body?: any): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  public async put<T>(path: string, body?: any): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  public async patch<T>(path: string, body?: any): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  public async delete<T>(path: string): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(url, { method: 'DELETE' });
  }

  private buildUrl(path: string, params?: Record<string, any>): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${cleanPath}`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080');

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          url.searchParams.set(key, String(val));
        }
      });
    }

    return url.toString();
  }

  private async request<T>(url: string, options: RequestInit): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch {
        errorData = await res.text();
      }
      throw new ApiError(res.status, res.statusText, errorData);
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return null as unknown as T;
    }

    const json = await res.json();

    // If Laravel pagination response ({ data: [...] }), and caller expects array, we can let caller handle it or extract if needed.
    return json as T;
  }
}
