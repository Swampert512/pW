import { Proyecto } from '../entities/proyecto';

/**
 * Puerto (interfaz) para el repositorio de Proyectos.
 *
 * Principio de Inversión de Dependencias (DIP):
 * - El dominio define el puerto (interfaz).
 * - La infraestructura implementa el adaptador.
 * - El dominio no conoce la implementación concreta (BD, API, etc.).
 *
 * SRP: Solo contiene métodos relacionados con persistencia de proyectos.
 *
 * @interface IProyectoRepository
 */
export interface IProyectoRepository {
  /** Guarda un nuevo proyecto */
  save(proyecto: Proyecto): Promise<Proyecto>;

  /** Busca un proyecto por su ID */
  findById(id: string): Promise<Proyecto | null>;

  /** Obtiene todos los proyectos (opcionalmente filtrados por no archivados) */
  findAll(includeArchived?: boolean): Promise<Proyecto[]>;

  /** Actualiza un proyecto existente */
  update(proyecto: Proyecto): Promise<Proyecto>;

  /** Elimina un proyecto por ID */
  delete(id: string): Promise<void>;
}