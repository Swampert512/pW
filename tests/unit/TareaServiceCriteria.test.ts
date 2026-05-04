/**
 * Tests de criterios de aceptación para TareaService
 *
 * Explica por qué testear servicios:
 * 1. Los servicios orquestan domain + infrastructure
 * 2. Implementan reglas de NEGOCIO (no solo dominio)
 * 3. Integran transacciones y persistencia
 *
 * Por qué usar mocks:
 * - Aislamos la lógica del servicio
 * - No necesitamos BD real en tests unitarios
 * - Tests son rápidos y determinísticos
 * - Podemos simular escenarios complejos
 *
 * Criterios de aceptación cubiertos:
 * CA1: "No mover a Done sin responsable asignado"
 * CA2: "Dashboard retorna overdue tasks ordenadas por fecha"
 * CA3: "Validar que usuario pertenece al proyecto"
 */
import { TareaService } from '../../../backend/src/application/services/TareaService';
import { Tarea } from '../../../backend/src/domain/entities/Tarea';
import { Usuario } from '../../../backend/src/domain/entities/Usuario';
import { CrearTareaCommand } from '../../../backend/src/domain/commands/CrearTareaCommand';
import { MoverTareaCommand } from '../../../backend/src/domain/commands/MoverTareaCommand';
import { Priority, TaskState, UserRole } from '../../../shared/types/enums';

// Mocks
const mockTareaRepo = {
  save: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  findByState: jest.fn(),
  findByResponsible: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

const mockProyectoRepo = {
  save: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByTeam: jest.fn()
};

describe('TareaService - Criterios de Aceptación', () => {
  let service: TareaService;
  const futureDate = new Date(Date.now() + 86400000 * 30); // 30 días en el futuro
  const pastDate = new Date(Date.now() - 86400000 * 5); // 5 días pasados (overdue)
  const usuario = new Usuario('u1', 'Ana', 'ana@email.com', UserRole.MIEMBRO);
  const usuario2 = new Usuario('u2', 'Luis', 'luis@email.com', UserRole.MIEMBRO);
  const proyecto = {
    id: 'proj-1',
    archived: false,
    tieneMiembro: (id: string) => ['u1', 'u2'].includes(id)
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TareaService(mockTareaRepo as any, mockProyectoRepo as any);
  });

  describe('CA1: No mover a Done sin responsable', () => {
    it('debería rechazar moveTask a DONE si no hay responsable', async () => {
      const tarea = new Tarea('t1', 'Tarea sin dueño', 'Desc', 'proj-1', null, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);
      tarea.cambiarEstado(TaskState.TESTING);

      const command = new MoverTareaCommand(tarea, TaskState.DONE);

      await expect(service.moveTask(command)).rejects.toThrow(
        'sin responsable'
      );
      expect(mockTareaRepo.update).not.toHaveBeenCalled();
    });

    it('debería permitir moveTask a DONE SI hay responsable', async () => {
      const tarea = new Tarea('t1', 'Tarea con dueño', 'Desc', 'proj-1', usuario, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);
      tarea.cambiarEstado(TaskState.TESTING);

      mockTareaRepo.update.mockResolvedValue(tarea);

      const command = new MoverTareaCommand(tarea, TaskState.DONE);
      await service.moveTask(command);

      expect(mockTareaRepo.update).toHaveBeenCalledWith(tarea);
    });

    it('debería permitir otras transiciones sin responsable', async () => {
      const tarea = new Tarea('t1', 'Sin responsable', 'Desc', 'proj-1', null, futureDate);

      mockTareaRepo.update.mockResolvedValue(tarea);

      const command = new MoverTareaCommand(tarea, TaskState.IN_PROGRESS);
      await service.moveTask(command);

      expect(mockTareaRepo.update).toHaveBeenCalled();
    });
  });

  describe('CA2: Dashboard retorna overdue tasks ordenadas', () => {
    it('debería identificar tareas vencidas (past dueDate y no DONE)', async () => {
      // Tareas de prueba
      const t1 = new Tarea('t1', 'Vencida hace 10 días', 'Desc', 'proj-1', usuario, new Date(Date.now() - 86400000 * 10));
      const t2 = new Tarea('t2', 'Vencida hace 5 días', 'Desc', 'proj-1', usuario, new Date(Date.now() - 86400000 * 5));
      const t3 = new Tarea('t3', 'Futura', 'Desc', 'proj-1', usuario, futureDate);
      const t4 = new Tarea('t4', 'Vencida pero DONE', 'Desc', 'proj-1', usuario, pastDate);
      t4.cambiarEstado(TaskState.IN_PROGRESS);
      t4.cambiarEstado(TaskState.TESTING);
      t4.cambiarEstado(TaskState.DONE);

      mockTareaRepo.findAll.mockResolvedValue([t1, t2, t3, t4]);

      const stats = await service.getDashboardStats('proj-1');

      // Debe haber 2 overdue (t1 y t2, no t4 porque está DONE)
      expect(stats.overdueCount).toBe(2);
      expect(stats.overdueTasks.length).toBe(2);
    });

    it('debería ordenar overdue tasks por fecha (más antiguas primero)', async () => {
      const ahora = Date.now();
      const t1 = new Tarea('t1', 'Vencida hace 30 días', 'D', 'proj-1', null, new Date(ahora - 86400000 * 30));
      const t2 = new Tarea('t2', 'Vencida hace 5 días', 'D', 'proj-1', null, new Date(ahora - 86400000 * 5));
      const t3 = new Tarea('t3', 'Vencida hace 15 días', 'D', 'proj-1', null, new Date(ahora - 86400000 * 15));

      mockTareaRepo.findAll.mockResolvedValue([t2, t3, t1]); // Orden aleatorio

      const stats = await service.getDashboardStats('proj-1');

      // Deben estar ordenadas: t1 (hace 30 días) → t3 (15 días) → t2 (5 días)
      expect(stats.overdueTasks[0].id).toBe('t1');
      expect(stats.overdueTasks[1].id).toBe('t3');
      expect(stats.overdueTasks[2].id).toBe('t2');
    });

    it('debería contar correctamente tareas pendientes (no DONE)', async () => {
      const t1 = new Tarea('t1', 'TODO', 'D', 'proj-1', usuario, futureDate);
      const t2 = new Tarea('t2', 'IN_PROGRESS', 'D', 'proj-1', usuario, futureDate);
      t2.cambiarEstado(TaskState.IN_PROGRESS);
      const t3 = new Tarea('t3', 'DONE', 'D', 'proj-1', usuario, futureDate);
      t3.cambiarEstado(TaskState.IN_PROGRESS);
      t3.cambiarEstado(TaskState.TESTING);
      t3.cambiarEstado(TaskState.DONE);

      mockTareaRepo.findAll.mockResolvedValue([t1, t2, t3]);

      const stats = await service.getDashboardStats('proj-1');

      expect(stats.totalTasks).toBe(3);
      expect(stats.completedTasks).toBe(1);
      expect(stats.pendingTasks).toBe(2); // t1 y t2
    });

    it('debería contar carga por usuario (solo tareas pendientes)', async () => {
      const t1 = new Tarea('t1', 'Ana TODO', 'D', 'proj-1', usuario, futureDate);
      const t2 = new Tarea('t2', 'Ana IN_PROGRESS', 'D', 'proj-1', usuario, futureDate);
      t2.cambiarEstado(TaskState.IN_PROGRESS);
      const t3 = new Tarea('t3', 'Ana DONE', 'D', 'proj-1', usuario, futureDate);
      t3.cambiarEstado(TaskState.IN_PROGRESS);
      t3.cambiarEstado(TaskState.TESTING);
      t3.cambiarEstado(TaskState.DONE);
      const t4 = new Tarea('t4', 'Luis TODO', 'D', 'proj-1', usuario2, futureDate);

      mockTareaRepo.findAll.mockResolvedValue([t1, t2, t3, t4]);

      const stats = await service.getDashboardStats('proj-1');

      // Ana: 2 tareas (t1 y t2, no cuenta t3 DONE)
      // Luis: 1 tarea (t4)
      expect(stats.loadByUser['u1'].taskCount).toBe(2);
      expect(stats.loadByUser['u2'].taskCount).toBe(1);
    });
  });

  describe('CA3: Validar usuario pertenece al proyecto', () => {
    it('debería rechazar asignación si usuario NO pertenece al proyecto', async () => {
      const usuarioExterno = new Usuario('u-ext', 'Externo', 'ext@email.com', UserRole.MIEMBRO);
      const tarea = new Tarea('t1', 'T', 'D', 'proj-1', null, futureDate);

      mockProyectoRepo.findById.mockResolvedValue(proyecto);

      const command = new (require('../../../backend/src/domain/commands/AsignarResponsableCommand')).AsignarResponsableCommand(
        tarea,
        usuarioExterno
      );

      await expect(service.assignResponsible(command)).rejects.toThrow(
        'no pertenece'
      );
      expect(mockTareaRepo.update).not.toHaveBeenCalled();
    });

    it('debería permitir asignación si usuario SÍ pertenece al proyecto', async () => {
      const tarea = new Tarea('t1', 'T', 'D', 'proj-1', null, futureDate);

      mockProyectoRepo.findById.mockResolvedValue(proyecto);
      mockTareaRepo.update.mockResolvedValue(tarea);

      const command = new (require('../../../backend/src/domain/commands/AsignarResponsableCommand')).AsignarResponsableCommand(
        tarea,
        usuario
      );

      await service.assignResponsible(command);

      expect(mockTareaRepo.update).toHaveBeenCalled();
    });

    it('debería rechazar si proyecto no existe', async () => {
      const tarea = new Tarea('t1', 'T', 'D', 'proj-inexistente', null, futureDate);

      mockProyectoRepo.findById.mockResolvedValue(null);

      const command = new (require('../../../backend/src/domain/commands/AsignarResponsableCommand')).AsignarResponsableCommand(
        tarea,
        usuario
      );

      await expect(service.assignResponsible(command)).rejects.toThrow(
        'no encontrado'
      );
    });
  });

  describe('Creación de tareas - Validaciones de aplicación', () => {
    it('debería rechazar si proyecto está archivado', async () => {
      const proyectoArchivado = { ...proyecto, archived: true };
      mockProyectoRepo.findById.mockResolvedValue(proyectoArchivado);

      const command = new CrearTareaCommand('T', 'D', 'proj-1', futureDate);

      await expect(service.createTask(command)).rejects.toThrow(
        'archivado'
      );
    });

    it('debería aceptar si proyecto existe y no está archivado', async () => {
      const tarea = new Tarea('t1', 'T', 'D', 'proj-1', null, futureDate);
      mockProyectoRepo.findById.mockResolvedValue(proyecto);
      mockTareaRepo.save.mockResolvedValue(tarea);

      const command = new CrearTareaCommand('T', 'D', 'proj-1', futureDate);

      const result = await service.createTask(command);

      expect(result).toBe(tarea);
      expect(mockTareaRepo.save).toHaveBeenCalled();
    });
  });
});