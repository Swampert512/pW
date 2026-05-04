"/**
 * Barrel export del módulo Domain
 *
 * Exporta todas las entidades, comandos y puertos del dominio.
 * Facilita las importaciones desde capas superiores (application, infrastructure).
 */
export { Tarea } from './entities/Tarea';
export { Proyecto } from './entities/Proyecto';
export { Usuario } from './entities/Usuario';

export { CrearTareaCommand } from './commands/CrearTareaCommand';
export { CrearProyectoCommand } from './commands/CrearProyectoCommand';
export type { ProyectoData } from './commands/CrearProyectoCommand';
export { MoverTareaCommand } from './commands/MoverTareaCommand';
export { AsignarResponsableCommand } from './commands/AsignarResponsableCommand';

export { ITareaRepository } from './ports/ITareaRepository';
export { IProyectoRepository } from './ports/IProyectoRepository';

// Legacy exports (deprecados, mantener compatibilidad)
export { ITaskRepository } from './repositories/ITaskRepository';
export { CreateTaskCommand } from './commands/CreateTaskCommand';
export type { Task } from './entities/Task';"