import { Tarea } from '../entities/Tarea';

/**
 * Puerto (interfaz) para el repositorio de Tareas (versión legacy - mantener para compatibilidad)
 * Se ha migrado a backend/src/domain/ports/ITareaRepository.ts
 * @deprecated Usar ITareaRepository en su lugar
 */
export interface ITaskRepository {
  save(tarea: Tarea): Promise<Tarea>;
  findById(id: string): Promise<Tarea | null>;
  findAll(projectId?: string): Promise<Tarea[]>;
  update(tarea: Tarea): Promise<Tarea>;
  delete(id: string): Promise<void>;
}