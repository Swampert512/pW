/**
 * Tests para FilterController
 *
 * Valida:
 * - Aplicación de filtros
 * - Debounce en búsqueda
 * - Actualización de contador de resultados
 */

import { FilterController } from '../../../frontend/src/controllers/FilterController';
import { ProyectoModel } from '../../../frontend/src/models/ProyectoModel';
import { TareaModel } from '../../../frontend/src/models/TareaModel';
import { IProyecto, ITarea, TaskState, Priority } from '../../../frontend/src/models/types';

jest.mock('../../../frontend/src/models/ApiService');

describe('FilterController', () => {
  let container: HTMLElement;
  let proyecto: ProyectoModel;
  let controller: FilterController;
  let kanbanBoard: HTMLElement;

  const mockProyectoData: IProyecto = {
    id: 'proj-1',
    name: 'Proyecto',
    description: 'Desc',
    team: [
      { id: 'u1', name: 'Ana', email: 'ana@email.com', role: 'MIEMBRO' },
      { id: 'u2', name: 'Luis', email: 'luis@email.com', role: 'MIEMBRO' }
    ],
    archived: false
  };

  const createMockTarea = (
    id: string,
    title: string,
    priority: Priority,
    responsibleId: string | null,
    state: TaskState
  ): TareaModel => {
    const responsible = responsibleId
      ? mockProyectoData.team.find(u => u.id === responsibleId)
      : null;

    const data: ITarea = {
      id,
      title,
      description: 'Desc',
      projectId: 'proj-1',
      responsible: responsible || null,
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      priority,
      state,
      comments: []
    };
    return new TareaModel(data);
  };

  beforeEach(() => {
    container = document.createElement('div');
    kanbanBoard = document.createElement('div');
    kanbanBoard.className = 'kanban-board';
    document.body.appendChild(container);
    document.body.appendChild(kanbanBoard);

    proyecto = new ProyectoModel(mockProyectoData);
    proyecto['tareas'] = [
      createMockTarea('t1', 'Implementar login', Priority.ALTA, 'u1', TaskState.TODO),
      createMockTarea('t2', 'Escribir tests', Priority.MEDIA, 'u2', TaskState.IN_PROGRESS),
      createMockTarea('t3', 'Refactor', Priority.BAJA, 'u1', TaskState.TESTING),
      createMockTarea('t4', 'Deploy', Priority.ALTA, null, TaskState.TODO)
    ];

    controller = new FilterController(proyecto, container);
    controller.setKanbanBoard(kanbanBoard);

    // Agregar tarjetas al kanban para simular
    proyecto['tareas'].forEach(tarea => {
      const card = document.createElement('div');
      card.className = 'task-card';
      card.dataset.taskId = tarea.id;
      kanbanBoard.appendChild(card);
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
    document.body.removeChild(kanbanBoard);
  });

  describe('Renderizado de filtros', () => {
    it('debería crear select para responsable', () => {
      const select = container.querySelector('.filter-responsible');
      expect(select).toBeTruthy();

      const options = select?.querySelectorAll('option');
      expect(options?.length).toBeGreaterThan(0);
    });

    it('debería crear select para prioridad', () => {
      const select = container.querySelector('.filter-priority');
      expect(select).toBeTruthy();
    });

    it('debería crear input de búsqueda', () => {
      const search = container.querySelector('.filter-search');
      expect(search).toBeTruthy();
    });
  });

  describe('Filtrado por responsable', () => {
    it('debería mostrar solo tareas del usuario seleccionado', () => {
      const select = container.querySelector('.filter-responsible') as HTMLSelectElement;
      select.value = 'u1';

      const event = new Event('change', { bubbles: true });
      select.dispatchEvent(event);

      const visible = Array.from(kanbanBoard.querySelectorAll('.task-card')).filter(
        card => (card as HTMLElement).style.display !== 'none'
      );

      expect(visible.length).toBe(2); // t1 y t3 son de u1
    });
  });

  describe('Filtrado por prioridad', () => {
    it('debería mostrar solo tareas con prioridad ALTA', () => {
      const select = container.querySelector('.filter-priority') as HTMLSelectElement;
      select.value = 'ALTA';

      const event = new Event('change', { bubbles: true });
      select.dispatchEvent(event);

      const visible = Array.from(kanbanBoard.querySelectorAll('.task-card')).filter(
        card => (card as HTMLElement).style.display !== 'none'
      );

      expect(visible.length).toBe(2); // t1 y t4 tienen ALTA
    });
  });

  describe('Búsqueda con debounce', () => {
    it('debería filtrar por título', async () => {
      const search = container.querySelector('.filter-search') as HTMLInputElement;
      search.value = 'login';

      const event = new Event('input', { bubbles: true });
      search.dispatchEvent(event);

      // Esperar a que se ejecute debounce (300ms)
      await new Promise(resolve => setTimeout(resolve, 350));

      const visible = Array.from(kanbanBoard.querySelectorAll('.task-card')).filter(
        card => (card as HTMLElement).style.display !== 'none'
      );

      expect(visible.length).toBe(1); // Solo "Implementar login"
    });
  });

  describe('Limpiar filtros', () => {
    it('debería limpiar todos los filtros', () => {
      const responsibleSelect = container.querySelector('.filter-responsible') as HTMLSelectElement;
      const searchInput = container.querySelector('.filter-search') as HTMLInputElement;

      responsibleSelect.value = 'u1';
      searchInput.value = 'test';

      const clearBtn = container.querySelector('.btn-clear-filters') as HTMLButtonElement;
      clearBtn.click();

      expect(responsibleSelect.value).toBe('');
      expect(searchInput.value).toBe('');

      // Todas las tarjetas deben estar visibles
      const visible = Array.from(kanbanBoard.querySelectorAll('.task-card')).filter(
        card => (card as HTMLElement).style.display !== 'none'
      );

      expect(visible.length).toBe(4);
    });
  });

  describe('Contador de resultados', () => {
    it('debería actualizar contador cuando se aplican filtros', () => {
      const select = container.querySelector('.filter-responsible') as HTMLSelectElement;
      select.value = 'u1';

      const event = new Event('change', { bubbles: true });
      select.dispatchEvent(event);

      const countElement = container.querySelector('#visible-count');
      expect(countElement?.textContent).toBe('2');
    });
  });
});
