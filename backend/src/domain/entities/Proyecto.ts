import { Usuario } from './Usuario';

/**
 * Entidad de dominio: Proyecto
 *
 * SRP: Gestiona los datos y reglas de negocio de un proyecto.
 * No conoce infraestructura (BD, rutas, etc).
 *
 * @class Proyecto
 */
export class Proyecto {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  private _team: Usuario[];
  private _archived: boolean;

  constructor(
    id: string,
    name: string,
    description: string,
    team: Usuario[] = [],
    archived: boolean = false
  ) {
    if (!id || id.trim().length === 0) throw new Error('ID de proyecto requerido');
    if (!name || name.trim().length === 0) throw new Error('Nombre de proyecto requerido');

    this.id = id;
    this.name = name.trim();
    this.description = description.trim();
    this._team = team;
    this._archived = archived;
  }

  // --- Getters ---

  get team(): Usuario[] {
    return [...this._team]; // Copia defensiva
  }

  get archived(): boolean {
    return this._archived;
  }

  // --- Métodos de dominio ---

  /**
   * Agrega un miembro al equipo del proyecto
   * @param usuario - Usuario a agregar
   * @throws {Error} Si el proyecto está archivado o el usuario ya existe
   */
  public agregarMiembro(usuario: Usuario): void {
    if (this._archived) {
      throw new Error('No se puede modificar un proyecto archivado');
    }
    if (this._team.some(m => m.equals(usuario))) {
      throw new Error('El usuario ya pertenece al equipo');
    }
    this._team.push(usuario);
  }

  /**
   * Elimina un miembro del equipo
   * @param usuarioId - ID del usuario a remover
   * @throws {Error} Si el proyecto está archivado
   */
  public removerMiembro(usuarioId: string): void {
    if (this._archived) {
      throw new Error('No se puede modificar un proyecto archivado');
    }
    this._team = this._team.filter(m => m.id !== usuarioId);
  }

  /**
   * Archiva el proyecto (ya no se pueden hacer cambios)
   */
  public archivar(): void {
    this._archived = true;
  }

  /**
   * Verifica si un usuario pertenece al equipo
   * @param usuarioId
   * @returns {boolean}
   */
  public tieneMiembro(usuarioId: string): boolean {
    return this._team.some(m => m.id === usuarioId);
  }

  /**
   * Convierte el proyecto a un objeto plano (para persistencia/serialización)
   * @returns {object}
   */
  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      team: this._team.map(m => ({ id: m.id, name: m.name, email: m.email, role: m.role })),
      archived: this._archived
    };
  }
}