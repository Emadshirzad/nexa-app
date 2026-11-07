import type { ICategoryRepository } from '@/domain/repositories/ICategoryRepository';
import { Category } from '@/domain/entities/Category';
import { ApiClient } from './ApiClient';
import type { UUID } from '@/shared/types/common';

export class ApiCategoryRepository implements ICategoryRepository {
  private api = ApiClient.getInstance();

  private toDomain(data: any): Category {
    return new Category({
      id: data.id as UUID,
      name: data.name,
      color: data.color || '#3b82f6',
      isActive: data.is_active !== undefined ? Boolean(data.is_active) : true,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString()
    });
  }

  public async findById(id: UUID): Promise<Category | null> {
    try {
      const data = await this.api.get<any>(`/categories/${id}`);
      return data ? this.toDomain(data) : null;
    } catch {
      return null;
    }
  }

  public async findByName(name: string): Promise<Category | null> {
    const list = await this.listAll();
    const target = name.trim().toLowerCase();
    return list.find((c) => c.name.toLowerCase() === target) ?? null;
  }

  public async listAll(): Promise<Category[]> {
    const res = await this.api.get<any>('/categories', { all: true });
    const list = Array.isArray(res) ? res : (res?.data || []);
    return list.map((item: any) => this.toDomain(item));
  }

  public async save(category: Category): Promise<void> {
    const payload = {
      name: category.name,
      color: category.color,
      is_active: category.isActive
    };

    try {
      // Check if existing
      const existing = await this.findById(category.id);
      if (existing) {
        await this.api.put(`/categories/${category.id}`, payload);
      } else {
        await this.api.post('/categories', { id: category.id, ...payload });
      }
    } catch {
      // If findById failed (404), create
      await this.api.post('/categories', { id: category.id, ...payload });
    }
  }
}
