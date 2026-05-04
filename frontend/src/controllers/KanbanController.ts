/**
 * KanbanController - Gestiona el tablero Kanban
 *
 * Responsabilidades:
 * 1. Renderizar columnas (TODO, IN_PROGRESS, TESTING, DONE)
 * 2. Manejar drag&drop nativo (sin librerías)
 * 3. Llamar al model para actualizar estado
 * 4. Mostrar notificaciones
 *
 * Performance: Usa throttle para dragover (max cada 50ms)
 */

import { ProyectoModel, TareaModel, TaskState } from '../models';
import { Toast } from '../utils/Toast';
import { throttle } from '../utils/helpers';
import { i18n } from '../utils/i18n';

interface DragData {
  taskId: string;
  fromColumn: TaskState;
}

export class KanbanController {
  private proyecto: ProyectoModel;
  private containerElement: HTMLElement;
  private draggedTask: TareaModel | null = null;
  private draggedFrom: TaskState | null = null;

  constructor(proyecto: ProyectoModel, containerElement: HTMLElement) {
    this.proyecto = proyecto;
    this.containerElement = containerElement;

    this.render();
    this.attachDragListeners();

    // Re-renderizar cuando el proyecto cambia
    this.proyecto.onChange(() => this.render());
  }

  /**
   * Renderiza el tablero Kanban
   */
  private render(): void {
    this.containerElement.innerHTML = `
      <div class="kanban-board">
        ${this.renderColumn('TODO')}
        ${this.renderColumn('IN_PROGRESS')}
        ${this.renderColumn('TESTING')}
        ${this.renderColumn('DONE')}
      </div>
    `;

    this.attachDragListeners();
  }

  /**
   * Renderiza una columna del Kanban
   */
  private renderColumn(state: TaskState): string {
    const tareas = this.proyecto.getTareasByState(state);
    const columnTitle = this.getColumnTitle(state);

    return `
      <div class="kanban-column" data-state="${state}">
        <div class="column-header">
          <h3>${columnTitle}</h3>
          <span class="task-count">${tareas.length}</span>
        </div>
        <div class="column-content" data-droppable="true">
          ${tareas.map(t => this.renderTaskCard(t)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Renderiza una tarjeta de tarea
   */
  private renderTaskCard(tarea: TareaModel): string {
    const daysFromDue = Math.ceil(
      (tarea.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const isOverdue = daysFromDue < 0 && !tarea.isCompleted;

    return `
      <div class="task-card"
           data-task-id="${tarea.id}"
           draggable="true"
           tabindex="0"
           role="button"
           aria-label="${tarea.title}">
        <div class="task-header">
          <h4>${tarea.title}</h4>
          <span class="priority-badge priority-${tarea.priority.toLowerCase()}">
            ${tarea.priority}
          </span>
        </div>
        <p class="task-description">${tarea.description}</p>
        <div class="task-meta">
          ${tarea.responsible
            ? `<span class="responsible">👤 ${tarea.responsible.name}</span>`
            : '<span class="unassigned">sin asignar</span>'
          }
          <span class="due-date ${isOverdue ? 'overdue' : ''}">
            ${isOverdue ? '⚠️' : '📅'} ${tarea.dueDateFormatted}
          </span>
        </div>
        ${tarea.comments.length > 0
          ? `<div class="comments-indicator">💬 ${tarea.comments.length}</div>`
          : ''
        }
      </div>
    `;
  }

  /**
   * Obtiene título de columna
   */
  private getColumnTitle(state: TaskState): string {
    const titles: Record<TaskState, string> = {
      'TODO': '📝 Por Hacer',
      'IN_PROGRESS': '⚙️ En Progreso',
      'TESTING': '🧪 Pruebas',
      'DONE': '✅ Completadas'
    };
    return titles[state];
  }

  /**
   * Adjunta event listeners para drag&drop
   */
  private attachDragListeners(): void {
    // Task cards (draggable)
    const cards = this.containerElement.querySelectorAll('.task-card');
    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => this.onDragStart(e as DragEvent));
      card.addEventListener('dragend', (e) => this.onDragEnd(e as DragEvent));

      // Soporte para teclado (arrow keys)
      card.addEventListener('keydown', (e) => this.onKeyDown(e as KeyboardEvent));
    });

    // Drop zones (columns)
    const dropZones = this.containerElement.querySelectorAll('.column-content');
    dropZones.forEach(zone => {
      zone.addEventListener('dragover', (e) => this.onDragOver(e as DragEvent));
      zone.addEventListener('dragleave', (e) => this.onDragLeave(e as DragEvent));
      zone.addEventListener('drop', (e) => this.onDrop(e as DragEvent));
    });
  }

  /**
   * dragstart: Usuario comienza a arrastrar
   */
  private onDragStart(e: DragEvent): void {
    const card = (e.target as HTMLElement).closest('.task-card');
    if (!card) return;

    const taskId = card.dataset.taskId;
    const column = card.closest('.kanban-column');
    const fromState = column?.getAttribute('data-state') as TaskState;

    this.draggedTask = this.proyecto.getTareaById(taskId!);
    this.draggedFrom = fromState;

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', card.innerHTML);
    }

    card.classList.add('dragging');
  }

  /**
   * dragend: Finaliza el arrastre
   */
  private onDragEnd(e: DragEvent): void {
    const card = (e.target as HTMLElement).closest('.task-card');
    card?.classList.remove('dragging');
  }

  /**
   * dragover: Está sobre una zona drop (throttled)
   */
  private onDragOver = throttle((e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    const column = (e.target as HTMLElement).closest('.column-content');
    column?.classList.add('drag-over');
  }, 50);

  /**
   * dragleave: Sale de la zona drop
   */
  private onDragLeave(e: DragEvent): void {
    const column = (e.target as HTMLElement).closest('.column-content');
    column?.classList.remove('drag-over');
  }

  /**
   * drop: Suelta la tarea en nueva columna
   */
  private async onDrop(e: DragEvent): Promise<void> {
    e.preventDefault();
    e.stopPropagation();

    const column = (e.target as HTMLElement).closest('.column-content');
    column?.classList.remove('drag-over');

    if (!this.draggedTask || !this.draggedFrom) return;

    const toColumn = column?.closest('.kanban-column');
    const toState = toColumn?.getAttribute('data-state') as TaskState;

    if (!toState || toState === this.draggedFrom) return;

    // Llamar al model para actualizar estado
    const success = await this.draggedTask.moveToState(toState);

    if (success) {
      Toast.success(
        i18n.t('tarea.movida', `Tarea movida a ${toState}`)
      );
    } else {
      Toast.error(
        i18n.t('tarea.error_mover', 'No se pudo mover la tarea')
      );
    }

    this.draggedTask = null;
    this.draggedFrom = null;
  }

  /**
   * Soporte para navegación por teclado (arrow keys)
   */
  private onKeyDown(e: KeyboardEvent): void {
    const card = (e.target as HTMLElement).closest('.task-card');
    if (!card) return;

    const taskId = card.dataset.taskId;
    const tarea = this.proyecto.getTareaById(taskId!);
    if (!tarea) return;

    const states: TaskState[] = ['TODO', 'IN_PROGRESS', 'TESTING', 'DONE'];
    const currentIndex = states.indexOf(tarea.state);

    if (e.key === 'ArrowRight' && currentIndex < states.length - 1) {
      e.preventDefault();
      tarea.moveToState(states[currentIndex + 1]);
      Toast.info('⌨️ ' + i18n.t('tarea.movida_teclado', 'Tarea movida'));
    } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
      e.preventDefault();
      tarea.moveToState(states[currentIndex - 1]);
      Toast.info('⌨️ ' + i18n.t('tarea.movida_teclado', 'Tarea movida'));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Simular click - podría abrir modal de detalles
      console.log('Abrir detalles de:', tarea.id);
    }
  }
}
