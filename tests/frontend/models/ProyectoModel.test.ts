/**
 * Tests para ProyectoModel
 */

import { ProyectoModel } from '../../../frontend/src/models/ProyectoModel';
import { TareaModel } from '../../../frontend/src/models/TareaModel';
import { IProyecto, ITarea, TaskState, Priority } from '../../../frontend/src/models/types';
import { ApiService } from '../../../frontend/src/models/ApiService';

jest.mock('../../../frontend/src/models/ApiService');

describe('ProyectoModel', () => {
  const mockProyectoData: IProyecto = {
    id: 'proj-1',
    name: 'Proyecto Demo',
    description: 'Un proyecto de prueba',
    team: [
      {
        id: 'u1',
        name: 'Ana',
        email: 'ana@email.com',
        role: 'MIEMBRO'
      }
    ],
    archived: false
  };

  const mockTareaData: ITarea = {
    id: 't1',
    title: 'Tarea 1',
    description: 'Desc',
    projectId: 'proj-1',
    responsible: null,
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    priority: Priority.MEDIA,
    state: TaskState.TODO,
    comments: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadTasks', () => {
    it('debería cargar tareas desde la API', async () => {
      const proyecto = new ProyectoModel(mockProyectoData);
      const mockTareas = [mockTareaData];

      (ApiService.get as jest.Mock).mockResolvedValue({
        success: true,
        data: mockTareas
      });

      const success = await proyecto.loadTasks();

      expect(success).toBe(true);
      expect(proyecto.getTareas.length).toBe(1);
      expect(proyecto.getTareas[0].id).toBe('t1');
    });

    it('debería retornar false si falla', async () => {
      const proyecto = new ProyectoModel(mockProyectoData);

      (ApiService.get as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Error'
      });

      const success = await proyecto.loadTasks();

      expect(success).toBe(false);
    });
  });

  describe('getTareasByState', () => {
    it('debería filtrar tareas por estado', async () => {
      const proyecto = new ProyectoModel(mockProyectoData);

      const tareas = [
        new TareaModel({ ...mockTareaData, id: 't1', state: TaskState.TODO }),
        new TareaModel({ ...mockTareaData, id: 't2', state: TaskState.IN_PROGRESS }),
        new TareaModel({ ...mockTareaData, id: 't3', state: TaskState.TODO })
      ];

      proyecto['tareas'] = tareas;

      const todoTareas = proyecto.getTareasByState(TaskState.TODO);

      expect(todoTareas.length).toBe(2);
      expect(todoTareas[0].id).toBe('t1');
      expect(todoTareas[1].id).toBe('t3');
    });
  });

  describe('getOverdueTasks', () => {
    it('debería retornar solo tareas vencidas', async () => {
      const proyecto = new ProyectoModel(mockProyectoData);
      const pastDate = new Date(Date.now() - 86400000).toISOString();

      const tareas = [
        new TareaModel({
          ...mockTareaData,
          id: 't1',
          dueDate: pastDate,
          state: TaskState.TODO
        }),
        new TareaModel({
          ...mockTareaData,
          id: 't2',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          state: TaskState.TODO
        })
      ];

      proyecto['tareas'] = tareas;

      const overdue = proyecto.getOverdueTasks();

      expect(overdue.length).toBe(1);
      expect(overdue[0].id).toBe('t1');
    });
  });
});
