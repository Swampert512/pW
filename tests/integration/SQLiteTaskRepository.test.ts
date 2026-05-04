import { SQLiteTaskRepository } from '../../backend/src/infrastructure/adapters/SQLiteTaskRepository';
import { Task } from '../../backend/src/domain/entities/Task';
import fs from 'fs';
import path from 'path';

describe('SQLiteTaskRepository (integration)', () => {
  let repository: SQLiteTaskRepository;
  const testDbPath = path.join(__dirname, '../../data/test-tasks.db');

  beforeAll(async () => {
    // Asegurar que el directorio data existe
    const dataDir = path.dirname(testDbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    repository = new SQLiteTaskRepository();
    await repository.connect();
  });

  afterAll(async () => {
    // Limpiar base de datos de prueba
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('debería crear y recuperar una tarea', async () => {
    const taskData = {
      title: 'Tarea de prueba',
      description: 'Descripción de prueba',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const created = await repository.create(taskData);
    
    expect(created.id).toBeDefined();
    expect(created.title).toBe('Tarea de prueba');
    expect(created.completed).toBe(false);

    const found = await repository.findById(created.id);
    expect(found).not.toBeNull();
    expect(found!.title).toBe('Tarea de prueba');
  });

  it('debería listar todas las tareas', async () => {
    const tasks = await repository.findAll();
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThanOrEqual(1);
  });

  it('debería actualizar una tarea', async () => {
    const taskData = {
      title: 'Tarea a actualizar',
      description: 'Original',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const created = await repository.create(taskData);
    const updated = await repository.update(created.id, { title: 'Actualizada', completed: true });

    expect(updated.title).toBe('Actualizada');
    expect(updated.completed).toBe(true);
  });

  it('debería eliminar una tarea', async () => {
    const taskData = {
      title: 'Tarea a eliminar',
      description: 'Será eliminada',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const created = await repository.create(taskData);
    await repository.delete(created.id);

    const found = await repository.findById(created.id);
    expect(found).toBeNull();
  });
});