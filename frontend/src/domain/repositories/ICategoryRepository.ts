import type { UUID } from '@/shared/types/common';
import type { Category } from '../entities/Category';

export interface ICategoryRepository {
  findById(id: UUID): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  listAll(): Promise<Category[]>;
  save(category: Category): Promise<void>;
}
