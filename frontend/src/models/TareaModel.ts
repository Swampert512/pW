/**
 * Modelo de Tarea - Encapsula lógica y estado de una tarea
 *
 * MVC Pattern:
 * - Model: Maneja datos y API calls
 * - Controller: Usa el model para responder acciones del usuario
 * - View: Renderiza datos del model
 *
 * Este Model:
 * 1. Mantiene datos de la tarea en sincronía con backend
 * 2. Expone métodos para cambiar estado
 * 3. Maneja validaciones de negocio
 * 4. Notifica cambios a listeners (Observer pattern)
 */

import { ITarea, TaskState, Priority, IUsuario, IApiResponse } from './types';
import { ApiService } from './ApiService';

type ChangeListener = (tarea: TareaModel) => void;

export class TareaModel {
  private data: ITarea;
  private listeners: ChangeListener[] = [];
  private isDirty = false; // Indica si hay cambios sin guardar

  constructor(data: ITarea) {
    this.data = { ...data };
  }

  // --- Getters (acceso seguro a datos) ---

  get id(): string {
    return this.data.id;
  }

  get title(): string {
    return this.data.title;
  }

  get description(): string {
    return this.data.description;
  }

  get projectId(): string {
    return this.data.projectId;
  }

  get responsible(): IUsuario | null {
    return this.data.responsible;
  }

  get dueDate(): Date {
    return new Date(this.data.dueDate);
  }

  get dueDateFormatted(): string {
    return this.dueDate.toLocaleDateString('es-ES');
  }

  get priority(): Priority {
    return this.data.priority;
  }

  get state(): TaskState {
    return this.data.state;
  }

  get comments(): string[] {
    return this.data.comments;
  }

  get isOverdue(): boolean {
    return this.dueDate < new Date() && this.state !== 'DONE';
  }

  get isCompleted(): boolean {
    return this.state === 'DONE';
  }

  get canMove(): boolean {
    return this.state !== 'DONE';
  }

  get isDone(): boolean {
    return this.isDirty;
  }

  // --- Métodos de cambio de estado ---

  /**
   * Cambia el estado de la tarea (TODO → IN_PROGRESS → TESTING → DONE)
   * Valida transiciones en backend
   */
  async moveToState(newState: TaskState): Promise<boolean> {
    if (!this.canMove) {
      console.error('No se puede mover una tarea completada');
      return false;
    }

    const response = await ApiService.put<ITarea>(
      `/tareas/${this.id}/move`,
      { state: newState }
    );

    if (response.success && response.data) {
      this.data = response.data;
      this.isDirty = false;
      this.notifyListeners();
      return true;
    }

    console.error('Error al mover tarea:', response.error);
    return false;
  }

  /**
   * Asigna un responsable a la tarea
   */
  async assignResponsible(usuario: IUsuario): Promise<boolean> {
    const response = await ApiService.put<ITarea>(
      `/tareas/${this.id}/assign`,
      {
        responsibleId: usuario.id,
        responsibleName: usuario.name,
        responsibleEmail: usuario.email,
        responsibleRole: usuario.role
      }
    );

    if (response.success && response.data) {
      this.data = response.data;
      this.isDirty = false;
      this.notifyListeners();
      return true;
    }

    console.error('Error al asignar responsable:', response.error);
    return false;
  }

  /**
   * Agrega un comentario a la tarea
   */
  addComment(text: string): void {
    if (!text.trim()) return;
    this.data.comments.push(text);
    this.isDirty = true;
    this.notifyListeners();
  }

  /**
   * Guarda la tarea en el backend
   */
  async save(): Promise<boolean> {
    if (!this.isDirty && this.id) {
      return true; // Ya está guardada
    }

    const endpoint = this.id ? `/tareas/${this.id}` : '/tareas';
    const method = this.id ? 'put' : 'post';

    const response = method === 'post'
      ? await ApiService.post<ITarea>(endpoint, this.toJSON())
      : await ApiService.put<ITarea>(endpoint, this.toJSON());

    if (response.success && response.data) {
      this.data = response.data;
      this.isDirty = false;
      this.notifyListeners();
      return true;
    }

    console.error('Error al guardar tarea:', response.error);
    return false;
  }

  /**
   * Elimina la tarea del backend
   */
  async delete(): Promise<boolean> {
    if (!this.id) return false;

    const response = await ApiService.delete(`/tareas/${this.id}`);

    if (response.success) {
      this.notifyListeners();
      return true;
    }

    console.error('Error al eliminar tarea:', response.error);
    return false;
  }

  // --- Observer pattern (notificar cambios a listeners) ---

  /**
   * Se suscribe a cambios del modelo
   */
  onChange(listener: ChangeListener): () => void {
    this.listeners.push(listener);

    // Retornar función para desuscribirse
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this));
  }

  // --- Serialización ---

  toJSON(): ITarea {
    return { ...this.data };
  }

  toString(): string {
    return `${this.title} (${this.state}) - ${this.dueDateFormatted}`;
  }
}
