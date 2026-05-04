import { Usuario } from './Usuario';
import { Priority, TaskState } from '../../../shared/types/enums';

/**
 * Entidad de dominio: Tarea
 *
 * SRP: Gestiona los datos y reglas de negocio de una tarea individual.
 * Contiene toda la lógica de validación de estados y prioridades.
 *
 * @class Tarea
 */
export class Tarea {
  public readonly id: string;
  public readonly title: string;
  public readonly description: string;
  public readonly projectId: string;
  private _responsible: Usuario | null;
  public readonly dueDate: Date;
  private _priority: Priority;
  private _state: TaskState;
  private _comments: string[];

  constructor(
    id: string,
    title: string,
    description: string,
    projectId: string,
    responsible: Usuario | null = null,
    dueDate: Date,
    priority: Priority = Priority.MEDIA,
    state: TaskState = TaskState.TODO,
    comments: string[] = []
  ) {
    if (!id || id.trim().length === 0) throw new Error('ID de tarea requerido');
    if (!title || title.trim().length === 0) throw new Error('Título de tarea requerido');
    if (!projectId || projectId.trim().length === 0) throw new Error('Proyecto ID requerido');
    if (!(dueDate instanceof Date) || isNaN(dueDate.getTime())) {
      throw new Error('Fecha de vencimiento inválida');
    }

    this.id = id;
    this.title = title.trim();
    this.description = description.trim();
    this.projectId = projectId;
    this._responsible = responsible;
    this.dueDate = dueDate;
    this._priority = priority;
    this._state = state;
    this._comments = [...comments];
  }

  // --- Getters ---

  get responsible(): Usuario | null {
    return this._responsible;
  }

  get priority(): Priority {
    return this._priority;
  }

  get state(): TaskState {
    return this._state;
  }

  get comments(): readonly string[] {
    return [...this._comments];
  }

  // --- Métodos de dominio ---

  /**
   * Cambia el estado de la tarea validando la transición
   * @param newState - Nuevo estado deseado
   * @throws {Error} Si la transición no es válida
   */
  public cambiarEstado(newState: TaskState): void {
    const transicionesValidas: Record<TaskState, TaskState[]> = {
      [TaskState.TODO]: [TaskState.IN_PROGRESS],
      [TaskState.IN_PROGRESS]: [TaskState.TODO, TaskState.TESTING],
      [TaskState.TESTING]: [TaskState.IN_PROGRESS, TaskState.DONE],
      [TaskState.DONE]: [] // Terminal: no se puede retroceder
    };

    const permitidos = transicionesValidas[this._state];
    if (!permitidos.includes(newState)) {
      throw new Error(
        `Transición inválida: ${this._state} → ${newState}. ` +
        `Solo se permite: ${permitidos.join(', ') || 'ninguna'}`
      );
    }

    this._state = newState;
  }

  /**
   * Asigna un responsable a la tarea
   * @param usuario - Usuario responsable
   * @throws {Error} Si la tarea ya está completada
   */
  public asignarResponsable(usuario: Usuario): void {
    if (this._state === TaskState.DONE) {
      throw new Error('No se puede asignar responsable a una tarea completada');
    }
    this._responsible = usuario;
  }

  /**
   * Cambia la prioridad de la tarea
   * @param newPriority - Nueva prioridad
   */
  public cambiarPrioridad(newPriority: Priority): void {
    this._priority = newPriority;
  }

  /**
   * Agrega un comentario a la tarea
   * @param comentario - Texto del comentario
   * @throws {Error} Si el comentario está vacío
   */
  public agregarComentario(comentario: string): void {
    if (!comentario || comentario.trim().length === 0) {
      throw new Error('El comentario no puede estar vacío');
    }
    this._comments.push(comentario.trim());
  }

  /**
   * Convierte la tarea a objeto plano
   * @returns {object}
   */
  public toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      projectId: this.projectId,
      responsible: this._responsible ? {
        id: this._responsible.id,
        name: this._responsible.name,
        email: this._responsible.email,
        role: this._responsible.role
      } : null,
      dueDate: this.dueDate.toISOString(),
      priority: this._priority,
      state: this._state,
      comments: [...this._comments]
    };
  }
}