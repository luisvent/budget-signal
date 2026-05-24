import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AccessCodeService } from './access-code.service';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly accessCode = inject(AccessCodeService);

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(this.resolveUrl(path), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...this.accessHeaders(),
        ...init.headers
      }
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => response.statusText);
      throw new Error(`API ${response.status} ${response.statusText}: ${detail}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json() as T;
  }

  private resolveUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');
    return `${apiBaseUrl}${normalizedPath}`;
  }

  private accessHeaders(): Record<string, string> {
    const code = this.accessCode.currentCode();
    return code ? { 'X-Budget-Signal-Code': code } : {};
  }
}
