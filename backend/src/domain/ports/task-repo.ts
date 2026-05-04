import { Task } from '../entities/task';

/**
 * Puerto (interfaz) para el repositorio de Tasks (genérico).
 *
 * Interfaz genérica para tareas simples sin estados complejos.
 * 
 * @interface ITaskRepository
 */
export interface ITaskRepository {
  save(task: Task): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  findAll(): Promise<Task[]>;
  update(task: Task): Promise<Task>;
  delete(id: string): Promise<void>;
}