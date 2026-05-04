/**
 * Servicio de aplicación: TareaService
 *
 * Orquesta operaciones sobre tareas usando comandos y puertos.
 * Coordina: creación, movimiento, asignación y estadísticas.
 *
 * SRP: Coordina la lógica de aplicación sin mezclar infraestructura.
 *
 * @class TareaService
 */
import { ITareaRepository } from '../../domain/ports/ITareaRepository';
import { IProyectoRepository } from '../../domain/ports/IProyectoRepository';
import { Tarea } from '../../domain/entities/Tarea';
import { Usuario } from '../../domain/entities/Usuario';
import { TaskState, Priority } from '../../../shared/types/enums';
import {
  CrearTareaCommand,
} from '../../domain/commands/CrearTareaCommand';
import {
  MoverTareaCommand,
} from '../../domain/commands/MoverTareaCommand';
import {
  AsignarResponsableCommand,
} from '../../domain/commands/AsignarResponsableCommand';

/**
 * Estadísticas del dashboard de un proyecto
 */
export interface DashboardStats {
  tasksByState: Record<TaskState, number>;
  overdueTasks: Tarea[];
  loadByUser: Record<string, { userId: string; userName: string; taskCount: number }>;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueCount: number;
}

export class TareaService {
  constructor(
    private readonly tareaRepo: ITareaRepository,
    private readonly proyectoRepo: IProyectoRepository
  ) {}

  /**
   * Crea una tarea usando CrearTareaCommand.
   * El comando valida y construye la entidad; luego se persiste.
   *
   * @param command - Comando con datos ya validados
   * @returns {Promise<Tarea>} Tarea persistida
   */
  async createTask(command: CrearTareaCommand): Promise<Tarea> {
    // Validar que el proyecto exista
    const proyecto = await this.proyectoRepo.findById(command.projectId);
    if (!proyecto) {
      throw new Error('El proyecto especificado no existe');
    }
    if (proyecto.archived) {
      throw new Error('No se pueden crear tareas en un proyecto archivado');
    }

    // El comando valida y construye la entidad Tarea
    const tarea = command.execute();

    return this.tareaRepo.save(tarea);
  }

  /**
   * Mueve una tarea a un nuevo estado.
   * Validación extra: no se puede mover a DONE sin responsable asignado.
   *
   * @param command - Comando MoverTareaCommand con tarea y nuevo estado
   * @returns {Promise<Tarea>} Tarea actualizada
   */
  async moveTask(command: MoverTareaCommand): Promise<Tarea> {
    if (command.newState === TaskState.DONE && !command.tarea.responsible) {
      throw new Error(
        'No se puede marcar como completada una tarea sin responsable asignado'
      );
    }

    // El comando ejecuta la transición validando reglas de dominio
    command.execute();

    return this.tareaRepo.update(command.tarea);
  }

  /**
   * Asigna un responsable a una tarea usando AsignarResponsableCommand.
   *
   * @param command - Comando con tarea y nuevo responsable
   * @returns {Promise<Tarea>} Tarea actualizada
   */
  async assignResponsible(
    command: AsignarResponsableCommand
  ): Promise<Tarea> {
    // Validar que el usuario pertenezca al proyecto (consultando repositorio)
    const tarea = command.tarea;
    const proyecto = await this.proyectoRepo.findById(tarea.projectId);
    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }
    if (!proyecto.tieneMiembro(command.nuevoResponsable.id)) {
      throw new Error(
        'El usuario no pertenece al equipo del proyecto'
      );
    }

    command.execute();

    return this.tareaRepo.update(tarea);
  }

  /**
   * Obtiene estadísticas completas del dashboard para un proyecto.
   *
   * @param projectId - ID del proyecto
   * @returns {Promise<DashboardStats>}
   */
  async getDashboardStats(projectId: string): Promise<DashboardStats> {
    const tareas = await this.tareaRepo.findAll(projectId);
    const now = new Date();

    // Agrupar por estado
    const tasksByState: Record<TaskState, number> = {
      [TaskState.TODO]: 0,
      [TaskState.IN_PROGRESS]: 0,
      [TaskState.TESTING]: 0,
      [TaskState.DONE]: 0
    };

    // Contar tareas vencidas (overdue: no DONE y dueDate < ahora)
    const overdueTasks: Tarea[] = [];
    const loadMap: Map<
      string,
      { userId: string; userName: string; taskCount: number }
    > = new Map();

    for (const tarea of tareas) {
      // Conteo por estado
      tasksByState[tarea.state] = (tasksByState[tarea.state] || 0) + 1;

      // Tareas vencidas
      if (tarea.state !== TaskState.DONE && tarea.dueDate < now) {
        overdueTasks.push(tarea);
      }

      // Carga por usuario (solo tareas pendientes)
      if (tarea.responsible && tarea.state !== TaskState.DONE) {
        const uid = tarea.responsible.id;
        const existing = loadMap.get(uid);
        if (existing) {
          existing.taskCount++;
        } else {
          loadMap.set(uid, {
            userId: uid,
            userName: tarea.responsible.name,
            taskCount: 1
          });
        }
      }
    }

    // Ordenar overdue por fecha (más antiguas primero)
    overdueTasks.sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
    );

    const totalTasks = tareas.length;
    const completedTasks = tasksByState[TaskState.DONE];
    const pendingTasks = totalTasks - completedTasks;

    return {
      tasksByState,
      overdueTasks,
      loadByUser: Object.fromEntries(loadMap),
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueCount: overdueTasks.length
    };
  }

  /**
   * Obtiene todas las tareas de un proyecto (opcionalmente filtradas).
   */
  async listTasks(projectId?: string): Promise<Tarea[]> {
    return this.tareaRepo.findAll(projectId);
  }

  /**
   * Elimina una tarea por ID.
   */
  async deleteTask(taskId: string): Promise<void> {
    return this.tareaRepo.delete(taskId);
  }
}