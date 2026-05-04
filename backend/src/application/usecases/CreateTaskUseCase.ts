import { ITareaRepository } from '../../domain/ports/ITareaRepository';
import { Tarea } from '../../domain/entities/Tarea';
import { CreateTaskCommand } from '../../domain/commands/CreateTaskCommand';
import { v4 as uuidv4 } from 'uuid';

/*
 * Caso de uso: Crear Tarea
 *
 * SRP: Orquesta la creación de una tarea usando el comando y el repositorio.
 * El comando valida los datos de entrada y construye la entidad Tarea.
 * El repositorio persiste la tarea a través del puerto.
 *
 * @class CreateTaskUseCase
 */
export class CreateTaskUseCase {
  constructor(private readonly tareaRepository: ITareaRepository) {}

  /*
   * Ejecuta el caso de uso: valida con el comando y persiste con el repositorio.
   * @param command - Comando CrearTareaCommand con los datos validados
   * @returns {Promise<Tarea>} - Tarea persistida
   */
  async execute(command: CrearTareaCommand): Promise<Tarea> {
    const tarea = command.execute();
    return this.tareaRepository.save(tarea);
  }
}