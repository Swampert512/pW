/**
 * Modelo de Proyecto - Encapsula lógica y estado de un proyecto
 *
 * Responsabilidades:
 * 1. Mantener lista de tareas del proyecto
 * 2. Cargar estadísticas del dashboard
 * 3. Exponer métodos para consultar y filtrar tareas
 * 4. Notificar cambios a listeners
 */

import { IProyecto, ITarea, IDashboardStats, IApiResponse } from './types';
import { ApiService } from './ApiService';
import { TareaModel } from './TareaModel';

type ChangeListener = (proyecto: ProyectoModel) => void;

export class ProyectoModel {
  private data: IProyecto;
  private tareas: TareaModel[] = [];
  private stats: IDashboardStats | null = null;
  private listeners: ChangeListener[] = [];
  private isLoading = false;

  constructor(data: IProyecto) {
    this.data = { ...data };
  }

  // --- Getters ---

  get id(): string {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  get description(): string {
    return this.data.description;
  }

  get team(): IProyecto['team'] {
    return this.data.team;
  }

  get archived(): boolean {
    return this.data.archived;
  }

  get getTareas(): TareaModel[] {
    return this.tareas;
  }

  get getStats(): IDashboardStats | null {
    return this.stats;
  }

  get getIsLoading(): boolean {
    return this.isLoading;
  }

  // --- Carga de datos ---

  /**
   * Carga todas las tareas del proyecto
   */
  async loadTasks(): Promise<boolean> {
    this.isLoading = true;
    this.notifyListeners();

    const response = await ApiService.get<ITarea[]>(
      `/tareas?projectId=${this.id}`
    );

    this.isLoading = false;

    if (response.success && response.data) {
      this.tareas = response.data.map(data => new TareaModel(data));
      this.notifyListeners();
      return true;
    }

    console.error('Error al cargar tareas:', response.error);
    return false;
  }

  /**
   * Carga estadísticas del dashboard
   */
  async loadStats(): Promise<boolean> {
    this.isLoading = true;
    this.notifyListeners();

    const response = await ApiService.get<IDashboardStats>(
      `/tareas/proyecto/${this.id}/dashboard`
    );

    this.isLoading = false;

    if (response.success && response.data) {
      this.stats = response.data;
      this.notifyListeners();
      return true;
    }

    console.error('Error al cargar estadísticas:', response.error);
    return false;
  }

  /**
   * Carga todo: tareas y estadísticas
   */
  async loadAll(): Promise<boolean> {
    const tasksOk = await this.loadTasks();
    const statsOk = await this.loadStats();
    return tasksOk && statsOk;
  }

  // --- Consultas filtradas ---

  /**
   * Obtiene tareas por estado
   */
  getTareasByState(state: string): TareaModel[] {
    return this.tareas.filter(t => t.state === state);
  }

  /**
   * Obtiene tareas asignadas a un usuario
   */
  getTareasByUser(userId: string): TareaModel[] {
    return this.tareas.filter(t => t.responsible?.id === userId);
  }

  /**
   * Obtiene tareas vencidas
   */
  getOverdueTasks(): TareaModel[] {
    return this.tareas.filter(t => t.isOverdue);
  }

  /**
   * Obtiene tareas completadas
   */
  getCompletedTasks(): TareaModel[] {
    return this.tareas.filter(t => t.isCompleted);
  }

  /**
   * Obtiene una tarea por ID
   */
  getTareaById(id: string): TareaModel | undefined {
    return this.tareas.find(t => t.id === id);
  }

  /**
   * Obtiene estadísticas en formato amigable para UI
   */
  getStatsForUI(): {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueCount: number;
    percentComplete: number;
  } | null {
    if (!this.stats) return null;

    const percentComplete = this.stats.totalTasks > 0
      ? Math.round((this.stats.completedTasks / this.stats.totalTasks) * 100)
      : 0;

    return {
      totalTasks: this.stats.totalTasks,
      completedTasks: this.stats.completedTasks,
      pendingTasks: this.stats.pendingTasks,
      overdueCount: this.stats.overdueCount,
      percentComplete
    };
  }

  // --- Mutaciones ---

  /**
   * Añade una tarea local (aún no guardada)
   */
  addTarea(tarea: TareaModel): void {
    this.tareas.push(tarea);
    this.notifyListeners();
  }

  /**
   * Elimina una tarea de la lista
   */
  removeTarea(id: string): void {
    this.tareas = this.tareas.filter(t => t.id !== id);
    this.notifyListeners();
  }

  /**
   * Actualiza una tarea en la lista
   */
  updateTarea(id: string, updates: Partial<ITarea>): void {
    const tarea = this.getTareaById(id);
    if (tarea) {
      const data = tarea.toJSON();
      const updated = { ...data, ...updates };
      const index = this.tareas.findIndex(t => t.id === id);
      if (index >= 0) {
        this.tareas[index] = new TareaModel(updated);
        this.notifyListeners();
      }
    }
  }

  // --- Observer pattern ---

  onChange(listener: ChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this));
  }

  // --- Serialización ---

  toJSON(): IProyecto {
    return { ...this.data };
  }

  toString(): string {
    return `${this.name} (${this.tareas.length} tareas)`;
  }
}
