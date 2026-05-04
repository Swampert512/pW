/**
 * Controlador de Proyecto - MVC Controller
 *
 * Orquesta:
 * 1. Carga de datos del proyecto
 * 2. Creación de widgets del dashboard
 * 3. Filtrado y renderizado de tareas
 */

import { ProyectoModel, WidgetFactory } from '../models';
import { TareaController } from './TareaController';

export class ProyectoController {
  private proyecto: ProyectoModel;
  private containerElement: HTMLElement;
  private dashboardElement: HTMLElement;
  private tareasElement: HTMLElement;
  private isInitialized = false;

  constructor(proyecto: ProyectoModel, containerElement: HTMLElement) {
    this.proyecto = proyecto;
    this.containerElement = containerElement;

    // Crear estructura inicial
    this.createLayout();
    this.dashboardElement = this.containerElement.querySelector('.dashboard') as HTMLElement;
    this.tareasElement = this.containerElement.querySelector('.tareas-list') as HTMLElement;

    // Escuchar cambios del modelo
    this.proyecto.onChange(() => this.render());
  }

  /**
   * Crea la estructura HTML inicial
   */
  private createLayout(): void {
    this.containerElement.innerHTML = `
      <div class="proyecto-container">
        <div class="proyecto-header">
          <h1>${this.proyecto.name}</h1>
          <p>${this.proyecto.description}</p>
          ${this.proyecto.archived ? '<span class="badge-archived">Archivado</span>' : ''}
        </div>
        <div class="proyecto-body">
          <div class="dashboard">
            <div class="loading">Cargando estadísticas...</div>
          </div>
          <div class="tareas-list">
            <div class="loading">Cargando tareas...</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Inicializa: carga datos y renderiza
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const success = await this.proyecto.loadAll();
    if (success) {
      this.isInitialized = true;
      this.render();
    } else {
      this.dashboardElement.innerHTML = '<p class="error">Error al cargar proyecto</p>';
    }
  }

  /**
   * Renderiza dashboard y lista de tareas
   */
  private render(): void {
    this.renderDashboard();
    this.renderTareas();
  }

  /**
   * Renderiza los widgets del dashboard
   */
  private renderDashboard(): void {
    const stats = this.proyecto.getStats;
    if (!stats) {
      this.dashboardElement.innerHTML = '<p class="error">Sin estadísticas</p>';
      return;
    }

    this.dashboardElement.innerHTML = '';

    // Crear widgets usando Factory
    const widgets = [
      WidgetFactory.create('taskStats', stats),
      WidgetFactory.create('pieChart', stats),
      WidgetFactory.create('overdueList', stats.overdueTasks),
      WidgetFactory.create('userLoad', stats)
    ];

    widgets.forEach(widget => {
      this.dashboardElement.appendChild(widget);
    });
  }

  /**
   * Renderiza lista de tareas
   */
  private renderTareas(): void {
    const tareas = this.proyecto.getTareas;

    if (tareas.length === 0) {
      this.tareasElement.innerHTML = '<p class="empty">No hay tareas en este proyecto</p>';
      return;
    }

    this.tareasElement.innerHTML = '';

    // Agrupar por estado
    const states = ['TODO', 'IN_PROGRESS', 'TESTING', 'DONE'];

    states.forEach(state => {
      const tareasPorEstado = this.proyecto.getTareasByState(state);
      if (tareasPorEstado.length === 0) return;

      const section = document.createElement('div');
      section.className = `tareas-section state-${state.toLowerCase()}`;

      const header = document.createElement('h3');
      header.textContent = `${state} (${tareasPorEstado.length})`;
      section.appendChild(header);

      tareasPorEstado.forEach(tarea => {
        const container = document.createElement('div');
        container.className = 'tarea-container';
        new TareaController(tarea, this.proyecto, container);
        section.appendChild(container);
      });

      this.tareasElement.appendChild(section);
    });
  }

  /**
   * Filtra tareas por usuario
   */
  filterByUser(userId: string): void {
    const tareasFiltradas = this.proyecto.getTareasByUser(userId);
    this.tareasElement.innerHTML = '';

    if (tareasFiltradas.length === 0) {
      this.tareasElement.innerHTML = '<p class="empty">Este usuario no tiene tareas</p>';
      return;
    }

    tareasFiltradas.forEach(tarea => {
      const container = document.createElement('div');
      container.className = 'tarea-container';
      new TareaController(tarea, this.proyecto, container);
      this.tareasElement.appendChild(container);
    });
  }

  /**
   * Muestra solo tareas vencidas
   */
  showOverdue(): void {
    const overdue = this.proyecto.getOverdueTasks();
    this.tareasElement.innerHTML = '';

    if (overdue.length === 0) {
      this.tareasElement.innerHTML = '<p class="empty">No hay tareas vencidas</p>';
      return;
    }

    overdue.forEach(tarea => {
      const container = document.createElement('div');
      container.className = 'tarea-container overdue';
      new TareaController(tarea, this.proyecto, container);
      this.tareasElement.appendChild(container);
    });
  }
}
