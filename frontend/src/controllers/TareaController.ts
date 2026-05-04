/**
 * Controlador de Tareas - MVC Controller
 *
 * MVC Pattern:
 * - Model: Maneja datos (TareaModel, ProyectoModel)
 * - Controller: Maneja eventos y lógica de interacción
 * - View: Renderiza HTML
 *
 * Responsabilidades del Controller:
 * 1. Escuchar eventos del usuario (clicks, inputs)
 * 2. Llamar métodos del Model
 * 3. Actualizar la View cuando el Model cambia
 */

import { TareaModel, ProyectoModel, TaskState } from '../models';

export class TareaController {
  private tarea: TareaModel;
  private proyecto: ProyectoModel;
  private containerElement: HTMLElement;

  constructor(
    tarea: TareaModel,
    proyecto: ProyectoModel,
    containerElement: HTMLElement
  ) {
    this.tarea = tarea;
    this.proyecto = proyecto;
    this.containerElement = containerElement;

    this.render();
    this.attachListeners();

    // Escuchar cambios del modelo
    this.tarea.onChange(() => this.render());
  }

  /**
   * Renderiza la vista de la tarea
   */
  private render(): void {
    this.containerElement.innerHTML = `
      <div class="tarea-card" data-id="${this.tarea.id}">
        <div class="tarea-header">
          <h3>${this.tarea.title}</h3>
          <span class="state-badge state-${this.tarea.state.toLowerCase()}">
            ${this.tarea.state}
          </span>
        </div>
        <div class="tarea-body">
          <p class="description">${this.tarea.description}</p>
          <div class="tarea-meta">
            <span class="due-date ${this.tarea.isOverdue ? 'overdue' : ''}">
              📅 ${this.tarea.dueDateFormatted}
            </span>
            <span class="priority priority-${this.tarea.priority.toLowerCase()}">
              ${this.tarea.priority}
            </span>
          </div>
          ${this.tarea.responsible
            ? `<div class="responsible">👤 ${this.tarea.responsible.name}</div>`
            : '<div class="no-responsible">Sin asignar</div>'
          }
        </div>
        <div class="tarea-actions">
          ${this.tarea.canMove ? `
            <button class="btn-move" data-state="${this.getNextState()}">
              ▶️ Mover a ${this.getNextState()}
            </button>
          ` : ''}
          <button class="btn-delete">🗑️ Eliminar</button>
        </div>
        <div class="tarea-comments">
          <div class="comments-list">
            ${this.tarea.comments.map(c => `<div class="comment">${c}</div>`).join('')}
          </div>
          <input type="text" class="comment-input" placeholder="Agregar comentario..." />
        </div>
      </div>
    `;
  }

  /**
   * Obtiene el siguiente estado válido
   */
  private getNextState(): TaskState {
    const transitions: Record<TaskState, TaskState> = {
      'TODO': 'IN_PROGRESS',
      'IN_PROGRESS': 'TESTING',
      'TESTING': 'DONE',
      'DONE': 'DONE'
    };
    return transitions[this.tarea.state];
  }

  /**
   * Adjunta event listeners
   */
  private attachListeners(): void {
    const btnMove = this.containerElement.querySelector('.btn-move');
    const btnDelete = this.containerElement.querySelector('.btn-delete');
    const commentInput = this.containerElement.querySelector('.comment-input') as HTMLInputElement;

    btnMove?.addEventListener('click', async () => {
      const newState = (btnMove as HTMLElement).dataset.state as TaskState;
      const success = await this.tarea.moveToState(newState);
      if (success) {
        console.log(`✅ Tarea movida a ${newState}`);
      } else {
        alert('❌ No se pudo mover la tarea');
      }
    });

    btnDelete?.addEventListener('click', async () => {
      if (confirm('¿Eliminar tarea?')) {
        const success = await this.tarea.delete();
        if (success) {
          this.proyecto.removeTarea(this.tarea.id);
          this.containerElement.remove();
        }
      }
    });

    commentInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && commentInput.value.trim()) {
        this.tarea.addComment(commentInput.value.trim());
        commentInput.value = '';
      }
    });
  }
}
