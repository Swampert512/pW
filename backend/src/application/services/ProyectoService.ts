/**
 * Servicio de aplicación: ProyectoService
 *
 * Orquesta operaciones relacionadas con Proyectos usando puertos y comandos.
 * No conoce infraestructura (BD, HTTP, etc.) — solo depende del dominio.
 *
 * SRP: Coordina la creación y gestión de proyectos.
 *
 * @class ProyectoService
 */
import { IProyectoRepository } from '../../domain/ports/IProyectoRepository';
import { Proyecto } from '../../domain/entities/Proyecto';
import { Usuario } from '../../domain/entities/Usuario';
import {
  CrearProyectoCommand,
  ProyectoData
} from '../../domain/commands/CrearProyectoCommand';

export class ProyectoService {
  constructor(
    private readonly proyectoRepo: IProyectoRepository
  ) {}

  /**
   * Crea un proyecto usando el comando CrearProyectoCommand.
   * El comando valida los datos y construye la entidad.
   * Luego se persiste a través del puerto.
   *
   * @param data - Datos del proyecto (name, description, team opcional)
   * @returns {Promise<Proyecto>} Proyecto persistido
   */
  async createProject(data: ProyectoData): Promise<Proyecto> {
    const command = new CrearProyectoCommand(
      data.name,
      data.description,
      data.team
    );

    const proyecto = command.execute();

    // Persistir a través del puerto (sin saber qué BD se usa)
    return this.proyectoRepo.save(proyecto);
  }

  /**
   * Obtiene todos los proyectos activos (no archivados)
   */
  async listActiveProjects(): Promise<Proyecto[]> {
    return this.proyectoRepo.findAll(false);
  }

  /**
   * Obtiene un proyecto por su ID
   */
  async getProjectById(id: string): Promise<Proyecto | null> {
    return this.proyectoRepo.findById(id);
  }

  /**
   * Agrega un miembro al equipo de un proyecto
   */
  async addMember(
    projectId: string,
    usuario: Usuario
  ): Promise<Proyecto> {
    const proyecto = await this.proyectoRepo.findById(projectId);
    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    proyecto.agregarMiembro(usuario);

    return this.proyectoRepo.update(proyecto);
  }

  /**
   * Archiva un proyecto
   */
  async archiveProject(projectId: string): Promise<Proyecto> {
    const proyecto = await this.proyectoRepo.findById(projectId);
    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    proyecto.archivar();
    return this.proyectoRepo.update(proyecto);
  }
}