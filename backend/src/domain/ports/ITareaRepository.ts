import { Tarea } from '../entities/Tarea';
import { TaskState } from '../../../shared/types/enums';

/**
 * Puerto (interfaz) para el repositorio de Tareas.
 *
 * Principio de Inversión de Dependencias (DIP):
 * - El dominio define el contrato (interfaz).
 * - La infraestructura implementa el adaptador concreto (SQLite, PostgreSQL, etc.).
 * - El dominio permanece puro, sin dependencias externas.
 *
 * SRP: Solo contiene métodos relacionados con persistencia de tareas.
 *
 * @interface ITareaRepository
 */
export interface ITareaRepository {
  /** Guarda una nueva tarea */
  save(tarea: Tarea): Promise<Tarea>;

  /** Busca una tarea por su ID */
  findById(id: string): Promise<Tarea | null>;

  /** Obtiene todas las tareas, opcionalmente filtradas por proyecto */
  findAll(projectId?: string): Promise<Tarea[]>;

  /** Busca tareas por estado */
  findByState(state: TaskState): Promise<Tarea[]>;

  /** Busca tareas asignadas a un usuario */
  findByResponsible(userId: string): Promise<Tarea[]>;

  /** Actualiza una tarea existente */
  update(tarea: Tarea): Promise<Tarea>;

  /** Elimina una tarea por ID */
  delete(id: string): Promise<void>;
}