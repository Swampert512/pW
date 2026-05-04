export interface CrearTareaCommand {
  proyectoId: string;
  titulo: string;
  descripcion: string;
  prioridad?: 'baja' | 'media' | 'alta';
}