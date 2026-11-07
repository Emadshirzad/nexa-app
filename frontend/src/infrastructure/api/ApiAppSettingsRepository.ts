import type { IAppSettingsRepository } from '@/domain/repositories/IAppSettingsRepository';
import { ApiClient } from './ApiClient';

export class ApiAppSettingsRepository implements IAppSettingsRepository {
  private api = ApiClient.getInstance();

  public async get(key: string): Promise<string | null> {
    try {
      const res = await this.api.get<{ key: string; value: string | null }>(`/settings/${encodeURIComponent(key)}`);
      return res.value ?? null;
    } catch {
      return null;
    }
  }

  public async set(key: string, value: string): Promise<void> {
    await this.api.put(`/settings/${encodeURIComponent(key)}`, { value });
  }

  public async getAll(): Promise<Record<string, string>> {
    const res = await this.api.get<Record<string, string>>('/settings');
    return res || {};
  }
}
