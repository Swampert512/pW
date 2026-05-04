/**
 * Conexión y esquema de base de datos SQLite.
 * Se encarga de abrir la conexión y crear las tablas con foreign keys.
 */
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

const DB_PATH = './data/taskmanager.db';

export async function createDatabase(): Promise<Database> {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  // Habilitar foreign keys
  await db.run('PRAGMA foreign_keys = ON');

  // Crear tablas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'MIEMBRO',
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS proyectos (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      archived INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS proyecto_usuarios (
      proyecto_id TEXT NOT NULL,
      usuario_id TEXT NOT NULL,
      PRIMARY KEY (proyecto_id, usuario_id),
      FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tareas (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      projectId TEXT NOT NULL,
      responsibleId TEXT,
      dueDate TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'MEDIA',
      state TEXT NOT NULL DEFAULT 'TODO',
      comments TEXT DEFAULT '[]',
      FOREIGN KEY (projectId) REFERENCES proyectos(id) ON DELETE CASCADE,
      FOREIGN KEY (responsibleId) REFERENCES usuarios(id) ON DELETE SET NULL
    );
  `);

  return db;
}

// Singleton para compartir la misma conexión
let dbInstance: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await createDatabase();
  }
  return dbInstance;
}

/**
 * Ejecuta una transacción con callback.
 * Útil para Commands que requieren atomicidad.
 */
export async function transaction<T>(
  callback: (db: Database) => Promise<T>
): Promise<T> {
  const db = await getDatabase();
  try {
    await db.run('BEGIN TRANSACTION');
    const result = await callback(db);
    await db.run('COMMIT');
    return result;
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}