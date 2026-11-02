import type { IDatabaseDriver } from '@/infrastructure/database/IDatabaseDriver';
import type { ITaskRepository } from '@/domain/repositories/ITaskRepository';
import {
  Task,
  type TaskStatus,
  type TaskPriority,
  type TaskRelatedType
} from '@/domain/entities/Task';
import type { UUID, ISODateString } from '@/shared/types/common';

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  priority: string;
  status: string;
  related_type: string | null;
  related_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export class SqliteTaskRepository implements ITaskRepository {
  private readonly driver: IDatabaseDriver;

  constructor(driver: IDatabaseDriver) {
    this.driver = driver;
  }

  public async findById(id: UUID): Promise<Task | null> {
    const rows = await this.driver.query<TaskRow>(
      `SELECT * FROM tasks WHERE id = ?;`,
      [id]
    );
    return rows[0] ? this.mapRowToEntity(rows[0]) : null;
  }

  public async listAll(options?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: ISODateString;
    relatedType?: string;
    relatedId?: UUID;
    limit?: number;
  }): Promise<Task[]> {
    let sql = `SELECT * FROM tasks WHERE 1=1`;
    const params: unknown[] = [];

    if (options?.status) {
      sql += ` AND status = ?`;
      params.push(options.status);
    }

    if (options?.priority) {
      sql += ` AND priority = ?`;
      params.push(options.priority);
    }

    if (options?.dueDate) {
      sql += ` AND due_date LIKE ?`;
      params.push(`${options.dueDate}%`);
    }

    if (options?.relatedType) {
      sql += ` AND related_type = ?`;
      params.push(options.relatedType);
    }

    if (options?.relatedId) {
      sql += ` AND related_id = ?`;
      params.push(options.relatedId);
    }

    sql += ` ORDER BY CASE priority WHEN 'urgent' THEN 1 ELSE 2 END, due_date ASC, created_at DESC`;

    if (options?.limit) {
      sql += ` LIMIT ?`;
      params.push(options.limit);
    }

    const rows = await this.driver.query<TaskRow>(sql, params);
    return rows.map((r) => this.mapRowToEntity(r));
  }

  public async getPendingTasksDueToday(): Promise<Task[]> {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await this.driver.query<TaskRow>(
      `SELECT * FROM tasks
       WHERE status != 'completed'
       AND due_date LIKE ?
       ORDER BY CASE priority WHEN 'urgent' THEN 1 ELSE 2 END, due_date ASC;`,
      [`${today}%`]
    );
    return rows.map((r) => this.mapRowToEntity(r));
  }

  public async getOverdueTasks(): Promise<Task[]> {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await this.driver.query<TaskRow>(
      `SELECT * FROM tasks
       WHERE status != 'completed'
       AND due_date < ?
       ORDER BY due_date ASC;`,
      [today]
    );
    return rows.map((r) => this.mapRowToEntity(r));
  }

  public async save(task: Task): Promise<void> {
    await this.driver.run(
      `INSERT INTO tasks (
        id, title, description, due_date, priority, status,
        related_type, related_id, completed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        due_date = excluded.due_date,
        priority = excluded.priority,
        status = excluded.status,
        related_type = excluded.related_type,
        related_id = excluded.related_id,
        completed_at = excluded.completed_at,
        updated_at = excluded.updated_at;`,
      [
        task.id,
        task.title,
        task.description || null,
        task.dueDate,
        task.priority,
        task.status,
        task.relatedType || null,
        task.relatedId || null,
        task.completedAt || null,
        task.createdAt,
        task.updatedAt
      ]
    );
  }

  public async delete(id: UUID): Promise<void> {
    await this.driver.run(`DELETE FROM tasks WHERE id = ?;`, [id]);
  }

  private mapRowToEntity(row: TaskRow): Task {
    return new Task({
      id: row.id as UUID,
      title: row.title,
      description: row.description,
      dueDate: row.due_date,
      priority: row.priority as TaskPriority,
      status: row.status as TaskStatus,
      relatedType: row.related_type as TaskRelatedType,
      relatedId: row.related_id as UUID | null,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}
