/**
 * Roles de usuario en el sistema
 * @enum {string}
 */
export enum UserRole {
  MIEMBRO = 'MIEMBRO',
  LIDER = 'LIDER',
  ADMIN = 'ADMIN'
}

/**
 * Prioridades de una tarea
 * @enum {string}
 */
export enum Priority {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA'
}

/**
 * Estados del ciclo de vida de una tarea
 * Sigue el flujo: ToDo → InProgress → Testing → Done
 * @enum {string}
 */
export enum TaskState {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  TESTING = 'TESTING',
  DONE = 'DONE'
}