/**
 * Tests para TareaModel
 *
 * Valida:
 * - Métodos de actualización de estado
 * - Llamadas a API
 * - Observer pattern (notificación de cambios)
 * - Getters y propiedades
 */

import { TareaModel } from '../../../frontend/src/models/TareaModel';
import { ITarea, Priority, TaskState } from '../../../frontend/src/models/types';
import { ApiService } from '../../../frontend/src/models/ApiService';

jest.mock('../../../frontend/src/models/ApiService');

describe('TareaModel', () => {
  const mockTareaData: ITarea = {
    id: 't1',
    title: 'Implementar login',
    description: 'Agregar autenticación JWT',
    projectId: 'proj-1',
    responsible: {
      id: 'u1',
      name: 'Ana García',
      email: 'ana@email.com',
      role: 'MIEMBRO'
    },
    dueDate: '2025-12-31T23:59:59Z',
    priority: Priority.ALTA,
    state: TaskState.TODO,
    comments: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Getters', () => {
    it('debería retornar propiedades correctamente', () => {
      const tarea = new TareaModel(mockTareaData);

      expect(tarea.id).toBe('t1');
      expect(tarea.title).toBe('Implementar login');
      expect(tarea.state).toBe(TaskState.TODO);
      expect(tarea.priority).toBe(Priority.ALTA);
      expect(tarea.responsible?.name).toBe('Ana García');
    });

    it('debería indicar si está vencida', () => {
      const pastTarea = new TareaModel({
        ...mockTareaData,
        dueDate: new Date(Date.now() - 86400000).toISOString() // Ayer
      });

      expect(pastTarea.isOverdue).toBe(true);

      const futureTarea = new TareaModel(mockTareaData);
      expect(futureTarea.isOverdue).toBe(false);
    });

    it('debería indicar si está completada', () => {
      const completada = new TareaModel({
        ...mockTareaData,
        state: TaskState.DONE
      });

      expect(completada.isCompleted).toBe(true);
    });
  });

  describe('moveToState', () => {
    it('debería llamar a ApiService.put con el nuevo estado', async () => {
      const tarea = new TareaModel(mockTareaData);
      (ApiService.put as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockTareaData, state: TaskState.IN_PROGRESS }
      });

      const success = await tarea.moveToState(TaskState.IN_PROGRESS);

      expect(success).toBe(true);
      expect(ApiService.put).toHaveBeenCalledWith(
        '/tareas/t1/move',
        { state: TaskState.IN_PROGRESS }
      );
    });

    it('debería notificar listeners cuando el estado cambia', async () => {
      const tarea = new TareaModel(mockTareaData);
      const listener = jest.fn();

      tarea.onChange(listener);

      (ApiService.put as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockTareaData, state: TaskState.IN_PROGRESS }
      });

      await tarea.moveToState(TaskState.IN_PROGRESS);

      expect(listener).toHaveBeenCalledWith(tarea);
    });

    it('debería retornar false si la API falla', async () => {
      const tarea = new TareaModel(mockTareaData);
      (ApiService.put as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Error en servidor'
      });

      const success = await tarea.moveToState(TaskState.DONE);

      expect(success).toBe(false);
    });
  });

  describe('assignResponsible', () => {
    it('debería asignar un responsable', async () => {
      const tarea = new TareaModel({ ...mockTareaData, responsible: null });
      const nuevoResponsable = {
        id: 'u2',
        name: 'Luis',
        email: 'luis@email.com',
        role: 'MIEMBRO' as const
      };

      (ApiService.put as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockTareaData, responsible: nuevoResponsable }
      });

      const success = await tarea.assignResponsible(nuevoResponsable);

      expect(success).toBe(true);
      expect(ApiService.put).toHaveBeenCalledWith(
        '/tareas/t1/assign',
        expect.objectContaining({
          responsibleId: 'u2'
        })
      );
    });
  });

  describe('addComment', () => {
    it('debería agregar un comentario localmente', () => {
      const tarea = new TareaModel(mockTareaData);
      const listener = jest.fn();

      tarea.onChange(listener);
      tarea.addComment('Buen progreso');

      expect(tarea.comments).toContain('Buen progreso');
      expect(listener).toHaveBeenCalled();
    });

    it('debería ignorar comentarios vacíos', () => {
      const tarea = new TareaModel(mockTareaData);

      tarea.addComment('   ');

      expect(tarea.comments.length).toBe(0);
    });
  });

  describe('save', () => {
    it('debería hacer POST si no existe ID', async () => {
      const newTarea = new TareaModel({
        ...mockTareaData,
        id: '' // Sin ID
      });

      (ApiService.post as jest.Mock).mockResolvedValue({
        success: true,
        data: mockTareaData
      });

      const success = await newTarea.save();

      expect(success).toBe(true);
      expect(ApiService.post).toHaveBeenCalledWith('/tareas', expect.any(Object));
    });

    it('debería hacer PUT si ya existe', async () => {
      const tarea = new TareaModel(mockTareaData);

      (ApiService.put as jest.Mock).mockResolvedValue({
        success: true,
        data: mockTareaData
      });

      const success = await tarea.save();

      expect(success).toBe(true);
      expect(ApiService.put).toHaveBeenCalledWith('/tareas/t1', expect.any(Object));
    });
  });

  describe('Observer pattern', () => {
    it('debería permitir suscribción y desuscripción', () => {
      const tarea = new TareaModel(mockTareaData);
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      const unsubscribe1 = tarea.onChange(listener1);
      tarea.onChange(listener2);

      tarea.addComment('Test');
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();

      listener1.mockClear();
      listener2.mockClear();

      unsubscribe1();
      tarea.addComment('Test 2');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });
});
