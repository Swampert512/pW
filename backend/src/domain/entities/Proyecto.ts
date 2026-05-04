import { Usuario } from './Usuario';

// Projeto entity
// TODO: agregar logo del proyecto
// TODO: implementar permisos por rol
export class Proyecto {
  id: string;
  name: string;
  description: string;
  team: Usuario[];
  archived: boolean;
  constructor(
    id: string,
    name: string,
    description: string,
    team: Usuario[] = [],
    archived: boolean = false
  ) {
    if (!id || !name) {
      throw new Error('ID y nombre requeridos');
    }
    this.id = id;
    this.name = name.trim();
    this.description = description.trim();
    this.team = team;
    this.archived = archived;
  }

  // agregar miembro
  agregarMiembro(usuario: Usuario): void {
    if (this.archived) {
      throw new Error('No se puede modificar proyecto archivado');
    }
    if (this.team.some(m => m.id === usuario.id)) {
      throw new Error('Usuario ya existe en el equipo');
    }
    this.team.push(usuario);
  }

  // quitar miembro
  removerMiembro(usuarioId: string): void {
    if (this.archived) {
      throw new Error('No se puede modificar proyecto archivado');
    }
    this.team = this.team.filter(m => m.id !== usuarioId);
  }

  // archivar proyecto
  archivar(): void {
    this.archived = true;
  }

  // check si usuario está en equipo
  tieneMiembro(usuarioId: string): boolean {
    return this.team.some(m => m.id === usuarioId);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      team: this.team.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role
      })),
      archived: this.archived
    };
  }
}