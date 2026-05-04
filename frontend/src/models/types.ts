/**
 * Tipos TypeScript para el frontend
 * Corresponden a las entidades del backend pero adaptadas para UI
 */

export type UserRole = 'MIEMBRO' | 'LIDER' | 'ADMIN';
export type Priority = 'BAJA' | 'MEDIA' | 'ALTA';
export type TaskState = 'TODO' | 'IN_PROGRESS' | 'TESTING' | 'DONE';

/**
 * Datos de Usuario (desde JWT o API)
 */
export interface IUsuario {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/**
 * Datos de Tarea
 */
export interface ITarea {
  id: string;
  title: string;
  description: string;
  projectId: string;
  responsible: IUsuario | null;
  dueDate: string;           // ISO 8601
  priority: Priority;
  state: TaskState;
  comments: string[];
}

/**
 * Datos de Proyecto
 */
export interface IProyecto {
  id: string;
  name: string;
  description: string;
  team: IUsuario[];
  archived: boolean;
}

/**
 * Estadísticas del Dashboard
 */
export interface IDashboardStats {
  tasksByState: Record<TaskState, number>;
  overdueTasks: ITarea[];
  loadByUser: Record<string, { userId: string; userName: string; taskCount: number }>;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueCount: number;
}

/**
 * Respuesta estándar de la API
 */
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Credenciales de login
 */
export interface ILoginCredentials {
  email: string;
  password: string;
}

/**
 * Payload del JWT
 */
export interface IJwtPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}