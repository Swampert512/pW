export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type TaskStatus = 'active' | 'completed';

export type Language = 'es' | 'en';