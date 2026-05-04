import { Tarea } from '../entities/Tarea';
import { TaskState } from '../../../shared/types/enums';

/**
 * Comando: MoverTareaCommand
 *
 * Patrón Command: Encapsula la acción de cambiar el estado de una tarea.
 * Beneficios:
 * - Auditoría: Podemos loguear cada cambio de estado (quién, cuándo, desde/hacia).
 * - Undo: Guardando el estado anterior, podemos revertir.
 * - Validación centralizada: La lógica de transiciones está en la entidad Tarea,
 *   el comando orquesta la validación y ejecución.
 *
 * SRP: Solo se encarga de ejecutar el cambio de estado con validación.
 * No sabe cómo persiste la tarea ni quién la solicita.
 *
 * @class MoverTareaCommand
 */
export class MoverTareaCommand {
  public readonly timestamp: Date;
  public readonly previousState: TaskState;

  constructor(
    public readonly tarea: Tarea,
    public readonly newState: TaskState
  ) {
    this.timestamp = new Date();
    this.previousState = tarea.state; // Guardamos el estado anterior para auditoría/undo
  }

  /**
   * Ejecuta el comando: cambia el estado de la tarea validando la transición.
   *
   * @returns {Tarea} - La misma tarea con el nuevo estado
   * @throws {Error} Si la transición no es válida según las reglas de dominio
   */
  public execute(): Tarea {
    // La validación de transiciones está dentro de la entidad Tarea
    this.tarea.cambiarEstado(this.newState);
    return this.tarea;
  }

  /**
   * Revierte el comando: restaura el estado anterior (Undo simple).
   *
   * @returns {Tarea} - Tarea con el estado restaurado
   */
  public undo(): Tarea {
    // Revertir al estado anterior usando el método de dominio
    this.tarea.cambiarEstado(this.previousState);
    return this.tarea;
  }

  /**
   * Convierte el comando a objeto plano para auditoría
   * @returns {object}
   */
  public toJSON() {
    return {
      type: 'MoverTareaCommand',
      timestamp: this.timestamp.toISOString(),
      data: {
        taskId: this.tarea.id,
        fromState: this.previousState,
        toState: this.newState
      }
    };
  }
}