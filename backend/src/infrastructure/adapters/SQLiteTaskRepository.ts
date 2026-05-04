import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { Task } from '../../domain/entities/Task';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export class SQLiteTaskRepository implements ITaskRepository {
  private db: Database | null = null;

  async connect(): Promise<void> {
    this.db = await open({
      filename: './data/tasks.db',
      driver: sqlite3.Database
    });
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        completed INTEGER DEFAULT 0,
        createdAt TEXT,
        updatedAt TEXT
      )
    `);
  }

  async create(task: Omit<Task, 'id'>): Promise<Task> {
    if (!this.db) throw new Error('Database not connected');
    const id = require('uuid').v4();
    await this.db.run(
      `INSERT INTO tasks (id, title, description, completed, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      task.title,
      task.description,
      task.completed ? 1 : 0,
      task.createdAt.toISOString(),
      task.updatedAt.toISOString()
    );
    return { id, ...task };
  }

  async findAll(): Promise<Task[]> {
    if (!this.db) throw new Error('Database not connected');
    const rows = await this.db.all(`SELECT * FROM tasks`);
    return rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      completed: row.completed === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }));
  }

  // (otros métodos: findById, update, delete) similares
}