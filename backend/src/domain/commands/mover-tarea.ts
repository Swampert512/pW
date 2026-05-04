export interface MoverTareaCommand {
  tareaId: string;
  nuevoEstado: 'pendiente' | 'en-progreso' | 'completada';
}