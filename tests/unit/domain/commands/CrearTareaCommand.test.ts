import { CrearTareaCommand } from '../../../../backend/src/domain/commands/CrearTareaCommand';
import { Tarea } from '../../../../backend/src/domain/entities/Tarea';
import { Usuario } from '../../../../backend/src/domain/entities/Usuario';
import { Priority, TaskState, UserRole } from '../../../../shared/types/enums';

describe('CrearTareaCommand', () => {
  const futureDate = new Date(Date.now() + 86400000 * 2); // 2 días en el futuro
  const usuario = new Usuario('u1', 'Ana', 'ana@email.com', UserRole.MIEMBRO);

  describe('execute()', () => {
    it('debería crear una tarea con datos válidos', () => {
      const command = new CrearTareaCommand(
        'Comprar leche',
        'Ir al supermercado',
        'proj-1',
        futureDate,
        Priority.ALTA,
        usuario
      );

      const tarea = command.execute();

      expect(tarea).toBeInstanceOf(Tarea);
      expect(tarea.title).toBe('Comprar leche');
      expect(tarea.description).toBe('Ir al supermercado');
      expect(tarea.projectId).toBe('proj-1');
      expect(tarea.priority).toBe(Priority.ALTA);
      expect(tarea.state).toBe(TaskState.TODO);
      expect(tarea.responsible).toEqual(usuario);
      expect(tarea.id).toBeDefined();
      expect(tarea.id.length).toBeGreaterThan(0);
    });

    it('debería usar MEDIA como prioridad por defecto', () => {
      const command = new CrearTareaCommand(
        'Tarea simple',
        'Desc',
        'proj-1',
        futureDate
      );

      const tarea = command.execute();
      expect(tarea.priority).toBe(Priority.MEDIA);
    });

    it('debería permitir responsable nulo', () => {
      const command = new CrearTareaCommand(
        'Tarea sin dueño',
        'Desc',
        'proj-1',
        futureDate,
        Priority.BAJA,
        null
      );

      const tarea = command.execute();
      expect(tarea.responsible).toBeNull();
    });

    it('debería lanzar error si el título está vacío', () => {
      const command = new CrearTareaCommand('', 'Desc', 'proj-1', futureDate);

      expect(() => command.execute()).toThrow('El título de la tarea es requerido');
    });

    it('debería lanzar error si projectId está vacío', () => {
      const command = new CrearTareaCommand('Título', 'Desc', '', futureDate);

      expect(() => command.execute()).toThrow('La tarea debe pertenecer a un proyecto');
    });

    it('debería lanzar error si dueDate es pasado', () => {
      const pastDate = new Date(Date.now() - 86400000);
      const command = new CrearTareaCommand('Título', 'Desc', 'proj-1', pastDate);

      expect(() => command.execute()).toThrow('La fecha de vencimiento debe ser futura');
    });
  });

  describe('toJSON()', () => {
    it('debería serializar el comando para auditoría', () => {
      const command = new CrearTareaCommand(
        'Auditar',
        'Desc',
        'proj-1',
        futureDate,
        Priority.ALTA,
        usuario
      );

      const log = command.toJSON();

      expect(log.type).toBe('CrearTareaCommand');
      expect(log.timestamp).toBeDefined();
      expect(log.data.title).toBe('Auditar');
      expect(log.data.responsibleId).toBe('u1');
      expect(log.data.priority).toBe(Priority.ALTA);
    });

    it('debería incluir responsibleId como null si no hay responsable', () => {
      const command = new CrearTareaCommand('Tarea', 'Desc', 'proj-1', futureDate);
      const log = command.toJSON();

      expect(log.data.responsibleId).toBeNull();
    });
  });
});