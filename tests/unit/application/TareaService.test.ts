import { TareaService, DashboardStats } from '../../../backend/src/application/services/TareaService';
import { Tarea } from '../../../backend/src/domain/entities/Tarea';
import { Usuario } from '../../../backend/src/domain/entities/Usuario';
import { CrearTareaCommand } from '../../../backend/src/domain/commands/CrearTareaCommand';
import { MoverTareaCommand } from '../../../backend/src/domain/commands/MoverTareaCommand';
import { AsignarResponsableCommand } from '../../../backend/src/domain/commands/AsignarResponsableCommand';
import { Proyecto } from '../../../backend/src/domain/entities/Proyecto';
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
  delete: jest.fn()
};

// Entities helpers
const futureDate = new Date('2026-01-01');
const pastDate = new Date('2024-01-01'); // Para tareas vencidas
const usuarioAna = new Usuario('u1', 'Ana', 'ana@email.com', UserRole.MIEMBRO);
const usuarioLuis = new Usuario('u2', 'Luis', 'luis@email.com', UserRole.MIEMBRO);
const proyecto = new Proyecto('proj-1', 'Proyecto Test', 'Desc', [usuarioAna, usuarioLuis]);

describe('TareaService', () => {
  let service: TareaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TareaService(mockTareaRepo, mockProyectoRepo);
  });

  describe('createTask', () => {
    it('debería crear una tarea con datos válidos', async () => {
      mockProyectoRepo.findById.mockResolvedValue(proyecto);

      const command = new CrearTareaCommand(
        'Nueva tarea', 'Desc', 'proj-1', futureDate, Priority.ALTA, usuarioAna
      );
      const tareaEsperada = command.execute(); // Simulamos que el comando la crea
      mockTareaRepo.save.mockResolvedValue(tareaEsperada);

      const result = await service.createTask(command);

      expect(result.title).toBe('Nueva tarea');
      expect(result.responsible!.id).toBe('u1');
      expect(mockProyectoRepo.findById).toHaveBeenCalledWith('proj-1');
      expect(mockTareaRepo.save).toHaveBeenCalledWith(expect.any(Tarea));
    });

    it('debería lanzar error si el proyecto no existe', async () => {
      mockProyectoRepo.findById.mockResolvedValue(null);

      const command = new CrearTareaCommand(
        'Tarea', 'Desc', 'proj-inexistente', futureDate
      );

      await expect(service.createTask(command)).rejects.toThrow(
        'El proyecto especificado no existe'
      );
      expect(mockTareaRepo.save).not.toHaveBeenCalled();
    });

    it('debería lanzar error si el proyecto está archivado', async () => {
      const proyectoArchivado = new Proyecto('proj-arch', 'Archivado', 'Desc', []);
      proyectoArchivado.archivar();
      mockProyectoRepo.findById.mockResolvedValue(proyectoArchivado);

      const command = new CrearTareaCommand(
        'Tarea', 'Desc', 'proj-arch', futureDate
      );

      await expect(service.createTask(command)).rejects.toThrow(
        'No se pueden crear tareas en un proyecto archivado'
      );
    });
  });

  describe('moveTask', () => {
    it('debería mover una tarea a IN_PROGRESS', async () => {
      const tarea = new Tarea('t1', 'Título', 'Desc', 'proj-1', null, futureDate);
      mockTareaRepo.update.mockResolvedValue(tarea);

      const command = new MoverTareaCommand(tarea, TaskState.IN_PROGRESS);
      const result = await service.moveTask(command);

      expect(result.state).toBe(TaskState.IN_PROGRESS);
      expect(mockTareaRepo.update).toHaveBeenCalledWith(tarea);
    });

    it('NO debería mover a DONE sin responsable', async () => {
      const tarea = new Tarea('t1', 'Título', 'Desc', 'proj-1', null, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);
      tarea.cambiarEstado(TaskState.TESTING);

      const command = new MoverTareaCommand(tarea, TaskState.DONE);

      await expect(service.moveTask(command)).rejects.toThrow(
        'No se puede marcar como completada una tarea sin responsable asignado'
      );
      expect(mockTareaRepo.update).not.toHaveBeenCalled();
    });

    it('debería permitir mover a DONE si tiene responsable', async () => {
      const tarea = new Tarea('t1', 'Título', 'Desc', 'proj-1', usuarioAna, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);
      tarea.cambiarEstado(TaskState.TESTING);

      mockTareaRepo.update.mockResolvedValue(tarea);

      const command = new MoverTareaCommand(tarea, TaskState.DONE);
      const result = await service.moveTask(command);

      expect(result.state).toBe(TaskState.DONE);
    });
  });

  describe('assignResponsible', () => {
    it('debería asignar responsable si el usuario pertenece al proyecto', async () => {
      const tarea = new Tarea('t1', 'Título', 'Desc', 'proj-1', null, futureDate);
      mockProyectoRepo.findById.mockResolvedValue(proyecto);
      mockTareaRepo.update.mockResolvedValue(tarea);

      const command = new AsignarResponsableCommand(tarea, usuarioAna);
      const result = await service.assignResponsible(command);

      expect(result.responsible).toEqual(usuarioAna);
    });

    it('NO debería asignar si el usuario no está en el equipo', async () => {
      const tarea = new Tarea('t1', 'Título', 'Desc', 'proj-1', null, futureDate);
      const usuarioExterno = new Usuario('u99', 'Externo', 'ext@email.com', UserRole.MIEMBRO);
      mockProyectoRepo.findById.mockResolvedValue(proyecto);

      const command = new AsignarResponsableCommand(tarea, usuarioExterno);

      await expect(service.assignResponsible(command)).rejects.toThrow(
        'El usuario no pertenece al equipo del proyecto'
      );
    });
  });

  describe('getDashboardStats', () => {
    it('debería calcular estadísticas correctamente', async () => {
      // Crear tareas de prueba
      const now = new Date();
      const t1 = new Tarea('t1', 'T1', 'Desc', 'proj-1', usuarioAna, new Date(now.getTime() + 86400000)); // Futura
      const t2 = new Tarea('t2', 'T2', 'Desc', 'proj-1', usuarioAna, pastDate); // Vencida
      const t3 = new Tarea('t3', 'T3', 'Desc', 'proj-1', usuarioLuis, pastDate); // Vencida
      const t4 = new Tarea('t4', 'T4', 'Desc', 'proj-1', usuarioAna, futureDate);

      // Poner t1 en IN_PROGRESS, t4 en DONE
      t1.cambiarEstado(TaskState.IN_PROGRESS);
      t4.cambiarEstado(TaskState.IN_PROGRESS);
      t4.cambiarEstado(TaskState.TESTING);
      t4.cambiarEstado(TaskState.DONE);

      mockTareaRepo.findAll.mockResolvedValue([t1, t2, t3, t4]);

      const stats = await service.getDashboardStats('proj-1');

      expect(stats.totalTasks).toBe(4);
      expect(stats.completedTasks).toBe(1);  // t4
      expect(stats.pendingTasks).toBe(3);    // t1, t2, t3
      expect(stats.overdueCount).toBe(2);    // t2, t3
      expect(stats.tasksByState[TaskState.TODO]).toBe(2);      // t2, t3
      expect(stats.tasksByState[TaskState.IN_PROGRESS]).toBe(1); // t1
      expect(stats.tasksByState[TaskState.DONE]).toBe(1);       // t4

      // Verificar overdue ordenadas
      expect(stats.overdueTasks.length).toBe(2);
      expect(stats.overdueTasks[0].id).toBe('t2');
      expect(stats.overdueTasks[1].id).toBe('t3');

      // Carga por usuario
      expect(stats.loadByUser['u1'].taskCount).toBe(2); // t1, t2 pendientes (t4 está DONE)
      expect(stats.loadByUser['u2'].taskCount).toBe(1); // t3
    });

    it('debería devolver estadísticas vacías si no hay tareas', async () => {
      mockTareaRepo.findAll.mockResolvedValue([]);

      const stats = await service.getDashboardStats('proj-1');

      expect(stats.totalTasks).toBe(0);
      expect(stats.overdueCount).toBe(0);
      expect(stats.loadByUser).toEqual({});
      expect(stats.tasksByState[TaskState.TODO]).toBe(0);
    });
  });

  describe('deleteTask', () => {
    it('debería eliminar una tarea', async () => {
      mockTareaRepo.delete.mockResolvedValue(undefined);

      await service.deleteTask('t1');

      expect(mockTareaRepo.delete).toHaveBeenCalledWith('t1');
    });
  });

  describe('listTasks', () => {
    it('debería listar todas las tareas sin filtro', async () => {
      const tareas = [
        new Tarea('t1', 'T1', 'Desc', 'proj-1', null, futureDate),
        new Tarea('t2', 'T2', 'Desc', 'proj-1', null, futureDate)
      ];
      mockTareaRepo.findAll.mockResolvedValue(tareas);

      const result = await service.listTasks();

      expect(result.length).toBe(2);
      expect(mockTareaRepo.findAll).toHaveBeenCalledWith(undefined);
    });

    it('debería filtrar por proyecto', async () => {
      mockTareaRepo.findAll.mockResolvedValue([]);

      await service.listTasks('proj-1');

      expect(mockTareaRepo.findAll).toHaveBeenCalledWith('proj-1');
    });
  });
});