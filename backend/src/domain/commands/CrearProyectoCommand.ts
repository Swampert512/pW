/**
 * Comando: CrearProyectoCommand
 *
 * Patrón Command: Encapsula la creación de un proyecto como objeto.
 * Permite auditoría, validación y transaccionalidad.
 *
 * SRP: Solo sabe cómo construir una entidad Proyecto válida.
 * No conoce persistencia ni infraestructura.
 *
 * @class CrearProyectoCommand
 */
import { Proyecto } from '../entities/Proyecto';
import { Usuario } from '../entities/Usuario';
import { v4 as uuidv4 } from 'uuid';

export interface ProyectoData {
  name: string;
  description: string;
  team?: Usuario[];
}

export class CrearProyectoCommand {
  public readonly timestamp: Date;

  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly team: Usuario[] = []
  ) {
    this.timestamp = new Date();
  }

  /**
   * Ejecuta el comando: valida y construye un Proyecto.
   * @returns {Proyecto} Nueva entidad Proyecto con id generado
   * @throws {Error} Si el nombre está vacío
   */
  public execute(): Proyecto {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('El nombre del proyecto es requerido');
    }

    const id = uuidv4();
    return new Proyecto(id, this.name.trim(), this.description.trim(), this.team);
  }

  /**
   * Serializa el comando para auditoría
   */
  public toJSON() {
    return {
      type: 'CrearProyectoCommand',
      timestamp: this.timestamp.toISOString(),
      data: {
        name: this.name,
        description: this.description,
        teamSize: this.team.length
      }
    };
  }
}