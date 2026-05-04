import { Tarea } from '../entities/Tarea';
import { Usuario } from '../entities/Usuario';
import { Priority, TaskState } from '../../../shared/types/enums';
import { v4 as uuidv4 } from 'uuid';

/**
 * Comando: CrearTareaCommand
 *
 * Patrón Command: Encapsula una acción (crear tarea) como un objeto.
 * Esto permite:
 * 1. Auditoría: Registrar qué comando se ejecutó, cuándo y por quién.
 * 2. Undo/Redo: Almacenar comandos ejecutados para revertir cambios.
 * 3. Transaccionalidad: Ejecutar comandos en lote y deshacer si falla.
 * 4. Colas de trabajo: Serializar comandos para ejecución asíncrona.
 *
 * SRP: Esta clase solo sabe cómo construir una Tarea válida.
 * La lógica de persistencia se delega al repositorio (puerto).
 *
 * @class CrearTareaCommand
 */
export class CrearTareaCommand {
  public readonly timestamp: Date;

  constructor(
    public readonly title: string,
    public readonly description: string,
    public readonly projectId: string,
    public readonly dueDate: Date,
    public readonly priority: Priority = Priority.MEDIA,
    public readonly responsible: Usuario | null = null
  ) {
    this.timestamp = new Date();
  }

  /**
   * Ejecuta el comando: valida los parámetros y crea una Tarea.
   * No persiste nada, solo construye la entidad de dominio.
   *
   * @returns {Tarea} - Nueva tarea con estado inicial TODO
   * @throws {Error} Si algún parámetro es inválido
   */
  public execute(): Tarea {
    // Validaciones de negocio
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('El título de la tarea es requerido');
    }
    if (!this.projectId || this.projectId.trim().length === 0) {
      throw new Error('La tarea debe pertenecer a un proyecto');
    }
    if (!this.dueDate || this.dueDate < new Date()) {
      throw new Error('La fecha de vencimiento debe ser futura');
    }

    const id = uuidv4();

    return new Tarea(
      id,
      this.title,
      this.description,
      this.projectId,
      this.responsible,
      this.dueDate,
      this.priority,
      TaskState.TODO // Estado inicial por defecto
    );
  }

  /**
   * Convierte el comando a un objeto plano para persistencia/auditoría
   * @returns {object}
   */
  public toJSON() {
    return {
      type: 'CrearTareaCommand',
      timestamp: this.timestamp.toISOString(),
      data: {
        title: this.title,
        description: this.description,
        projectId: this.projectId,
        dueDate: this.dueDate.toISOString(),
        priority: this.priority,
        responsibleId: this.responsible?.id ?? null
      }
    };
  }
}