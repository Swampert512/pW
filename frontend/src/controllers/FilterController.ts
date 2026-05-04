/**
 * FilterController - Gestiona filtros del Kanban
 *
 * Responsabilidades:
 * 1. Renderizar UI de filtros
 * 2. Escuchar cambios en inputs
 * 3. Filtrar tareas por responsible/priority/state
 * 4. Mostrar/ocultar tarjetas según filtros
 *
 * Performance: Debounce para búsqueda (300ms)
 */

import { ProyectoModel, IUsuario, Priority, TaskState } from '../models';
import { debounce } from '../utils/helpers';
import { i18n } from '../utils/i18n';

interface ActiveFilters {
  responsible: string | null;  // userId o null
  priority: Priority | null;    // 'ALTA' | 'MEDIA' | 'BAJA' o null
  state: TaskState | null;      // 'TODO' | 'IN_PROGRESS' | etc o null
  search: string;               // búsqueda por título
}

export class FilterController {
  private proyecto: ProyectoModel;
  private containerElement: HTMLElement;
  private kanbanBoard: HTMLElement | null = null;
  private activeFilters: ActiveFilters = {
    responsible: null,
    priority: null,
    state: null,
    search: ''
  };

  constructor(proyecto: ProyectoModel, containerElement: HTMLElement) {
    this.proyecto = proyecto;
    this.containerElement = containerElement;

    this.render();
    this.attachListeners();
  }

  /**
   * Asigna el elemento del Kanban para aplicar filtros
   */
  setKanbanBoard(board: HTMLElement): void {
    this.kanbanBoard = board;
  }

  /**
   * Renderiza UI de filtros
   */
  private render(): void {
    const users = this.proyecto.team;
    const priorities: Priority[] = ['ALTA', 'MEDIA', 'BAJA'];
    const states: TaskState[] = ['TODO', 'IN_PROGRESS', 'TESTING', 'DONE'];

    this.containerElement.innerHTML = `
      <div class="filters-bar">
        <div class="filters-group">
          <!-- Búsqueda por título -->
          <div class="filter-item">
            <input
              type="text"
              class="filter-search"
              placeholder="${i18n.t('filtros.buscar', 'Buscar por título...')}"
              aria-label="Búsqueda"
            />
          </div>

          <!-- Filtro por responsable -->
          <div class="filter-item">
            <label for="filter-responsible">
              👤 ${i18n.t('filtros.responsable', 'Responsable')}
            </label>
            <select
              id="filter-responsible"
              class="filter-select filter-responsible"
              aria-label="Filtrar por responsable"
            >
              <option value="">${i18n.t('filtros.todos', 'Todos')}</option>
              ${users.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
            </select>
          </div>

          <!-- Filtro por prioridad -->
          <div class="filter-item">
            <label for="filter-priority">
              🎯 ${i18n.t('filtros.prioridad', 'Prioridad')}
            </label>
            <select
              id="filter-priority"
              class="filter-select filter-priority"
              aria-label="Filtrar por prioridad"
            >
              <option value="">${i18n.t('filtros.todos', 'Todos')}</option>
              ${priorities.map(p => `<option value="${p}">${p}</option>`).join('')}
            </select>
          </div>

          <!-- Filtro por estado -->
          <div class="filter-item">
            <label for="filter-state">
              📊 ${i18n.t('filtros.estado', 'Estado')}
            </label>
            <select
              id="filter-state"
              class="filter-select filter-state"
              aria-label="Filtrar por estado"
            >
              <option value="">${i18n.t('filtros.todos', 'Todos')}</option>
              ${states.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>

          <!-- Botón limpiar filtros -->
          <button
            class="btn-clear-filters"
            aria-label="Limpiar filtros"
            title="${i18n.t('filtros.limpiar', 'Limpiar filtros')}"
          >
            ✕ ${i18n.t('filtros.limpiar', 'Limpiar')}
          </button>
        </div>

        <!-- Contador de resultados -->
        <div class="filter-stats">
          <span class="result-count">
            ${i18n.t('filtros.mostrando', 'Mostrando')} <strong id="visible-count">0</strong>
            ${i18n.t('filtros.de', 'de')} <strong>${this.proyecto.getTareas.length}</strong>
          </span>
        </div>
      </div>
    `;
  }

  /**
   * Adjunta event listeners
   */
  private attachListeners(): void {
    const searchInput = this.containerElement.querySelector('.filter-search') as HTMLInputElement;
    const responsibleSelect = this.containerElement.querySelector('.filter-responsible') as HTMLSelectElement;
    const prioritySelect = this.containerElement.querySelector('.filter-priority') as HTMLSelectElement;
    const stateSelect = this.containerElement.querySelector('.filter-state') as HTMLSelectElement;
    const clearBtn = this.containerElement.querySelector('.btn-clear-filters');

    // Búsqueda (debounced)
    searchInput?.addEventListener(
      'input',
      debounce((e) => {
        this.activeFilters.search = (e.target as HTMLInputElement).value.toLowerCase();
        this.applyFilters();
      }, 300)
    );

    // Selects (sin debounce, es inmediato)
    responsibleSelect?.addEventListener('change', (e) => {
      this.activeFilters.responsible = (e.target as HTMLSelectElement).value || null;
      this.applyFilters();
    });

    prioritySelect?.addEventListener('change', (e) => {
      this.activeFilters.priority = (e.target as HTMLSelectElement).value as Priority || null;
      this.applyFilters();
    });

    stateSelect?.addEventListener('change', (e) => {
      this.activeFilters.state = (e.target as HTMLSelectElement).value as TaskState || null;
      this.applyFilters();
    });

    // Botón limpiar
    clearBtn?.addEventListener('click', () => this.clearFilters());
  }

  /**
   * Aplica filtros a las tarjetas
   */
  private applyFilters(): void {
    if (!this.kanbanBoard) return;

    const cards = this.kanbanBoard.querySelectorAll('.task-card');
    let visibleCount = 0;

    cards.forEach(card => {
      const taskElement = card as HTMLElement;
      const show = this.matchesFilters(taskElement);

      if (show) {
        taskElement.style.display = '';
        visibleCount++;
      } else {
        taskElement.style.display = 'none';
      }
    });

    // Actualizar contador
    const countElement = this.containerElement.querySelector('#visible-count');
    if (countElement) {
      countElement.textContent = visibleCount.toString();
    }
  }

  /**
   * Verifica si una tarjeta coincide con los filtros activos
   */
  private matchesFilters(card: HTMLElement): boolean {
    // Obtener datos de la tarjeta
    const taskId = card.dataset.taskId;
    const tarea = this.proyecto.getTareaById(taskId!);

    if (!tarea) return false;

    // Filtro por búsqueda (título)
    if (this.activeFilters.search) {
      if (!tarea.title.toLowerCase().includes(this.activeFilters.search)) {
        return false;
      }
    }

    // Filtro por responsable
    if (this.activeFilters.responsible) {
      if (tarea.responsible?.id !== this.activeFilters.responsible) {
        return false;
      }
    }

    // Filtro por prioridad
    if (this.activeFilters.priority) {
      if (tarea.priority !== this.activeFilters.priority) {
        return false;
      }
    }

    // Filtro por estado
    if (this.activeFilters.state) {
      if (tarea.state !== this.activeFilters.state) {
        return false;
      }
    }

    return true;
  }

  /**
   * Limpia todos los filtros
   */
  private clearFilters(): void {
    this.activeFilters = {
      responsible: null,
      priority: null,
      state: null,
      search: ''
    };

    // Limpiar inputs
    (this.containerElement.querySelector('.filter-search') as HTMLInputElement).value = '';
    (this.containerElement.querySelector('.filter-responsible') as HTMLSelectElement).value = '';
    (this.containerElement.querySelector('.filter-priority') as HTMLSelectElement).value = '';
    (this.containerElement.querySelector('.filter-state') as HTMLSelectElement).value = '';

    this.applyFilters();
  }

  /**
   * Obtiene los filtros activos (para debugging)
   */
  getActiveFilters(): ActiveFilters {
    return { ...this.activeFilters };
  }
}
