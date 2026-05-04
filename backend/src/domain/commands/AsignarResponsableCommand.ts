import { Tarea } from '../entities/Tarea';
import { Usuario } from '../entities/Usuario';

/**
 * Comando: AsignarResponsableCommand
 *
 * Patrón Command: Encapsula la acción de asignar un responsable a una tarea.
 *
 * Beneficios:
 * - Auditoría: Podemos registrar quién asignó a quién y cuándo.
 * - Undo: Posibilidad de desasignar restaurando el responsable anterior.
 * - Validación: Centraliza las reglas (ej: no asignar a tareas completadas).
 *
 * SRP: Solo sabe cómo asignar un responsable validando reglas de dominio.
 * No conoce persistencia ni UI.
 *
 * @class AsignarResponsableCommand
 */
export class AsignarResponsableCommand {
  public readonly timestamp: Date;
  public readonly previousResponsible: Usuario | null;

  constructor(
    public readonly tarea: Tarea,
    public readonly nuevoResponsable: Usuario
  ) {
    this.timestamp = new Date();
    this.previousResponsible = tarea.responsible; // Guardamos para undo
  }

  /**
   * Ejecuta el comando: asigna el responsable a la tarea.
   * La validación (no asignar a tareas completadas) está en la entidad Tarea.
   *
   * @returns {Tarea} - Tarea con el nuevo responsable asignado
   * @throws {Error} Si la tarea está completada
   */
  public execute(): Tarea {
    this.tarea.asignarResponsable(this.nuevoResponsable);
    return this.tarea;
  }

  /**
   * Revierte el comando: restaura el responsable anterior (Undo).
   *
   * @returns {Tarea}
   */
  public undo(): Tarea {
    if (this.previousResponsible) {
      this.tarea.asignarResponsable(this.previousResponsible);
    }
    return this.tarea;
  }

  /**
   * Convierte el comando a objeto plano para auditoría
   * @returns {object}
   */
  public toJSON() {
    return {
      type: 'AsignarResponsableCommand',
      timestamp: this.timestamp.toISOString(),
      data: {
        taskId: this.tarea.id,
        previousResponsibleId: this.previousResponsible?.id ?? null,
        newResponsibleId: this.nuevoResponsable.id
      }
    };
  }
}