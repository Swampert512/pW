import { MoverTareaCommand } from '../../../../backend/src/domain/commands/MoverTareaCommand';
import { Tarea } from '../../../../backend/src/domain/entities/Tarea';
import { TaskState } from '../../../../shared/types/enums';

describe('MoverTareaCommand', () => {
  const futureDate = new Date('2025-12-31');

  function crearTareaEnEstado(state: TaskState): Tarea {
    const tarea = new Tarea(
      't1',
      'Tarea de prueba',
      'Descripción',
      'proj-1',
      null,
      futureDate
    );

    // Llevar la tarea al estado deseado mediante transiciones válidas
    const transiciones: TaskState[] = [
      TaskState.IN_PROGRESS,
      TaskState.TESTING,
      TaskState.DONE
    ];

    for (const s of transiciones) {
      if (s === state) break;
      if (tarea.state !== s) {
        try {
          tarea.cambiarEstado(s);
        } catch {
          break;
        }
      }
      if (tarea.state === state) break;
    }

    return tarea;
  }

  describe('execute()', () => {
    it('debería cambiar el estado de TODO a IN_PROGRESS', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'proj-1', null, futureDate);
      const command = new MoverTareaCommand(tarea, TaskState.IN_PROGRESS);

      const result = command.execute();

      expect(result.state).toBe(TaskState.IN_PROGRESS);
    });

    it('debería cambiar de IN_PROGRESS a TESTING', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'proj-1', null, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);

      const command = new MoverTareaCommand(tarea, TaskState.TESTING);
      const result = command.execute();

      expect(result.state).toBe(TaskState.TESTING);
    });

    it('debería lanzar error si la transición es inválida', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'proj-1', null, futureDate);
      // TODO → TESTING no está permitido

      const command = new MoverTareaCommand(tarea, TaskState.TESTING);

      expect(() => command.execute()).toThrow('Transición inválida');
    });

    it('no debería permitir retroceder desde DONE', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'proj-1', null, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);
      tarea.cambiarEstado(TaskState.TESTING);
      tarea.cambiarEstado(TaskState.DONE);

      const command = new MoverTareaCommand(tarea, TaskState.TODO);

      expect(() => command.execute()).toThrow('Transición inválida');
    });
  });

  describe('undo()', () => {
    it('debería revertir al estado anterior', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'proj-1', null, futureDate);
      expect(tarea.state).toBe(TaskState.TODO);

      const command = new MoverTareaCommand(tarea, TaskState.IN_PROGRESS);
      command.execute();
      expect(tarea.state).toBe(TaskState.IN_PROGRESS);

      command.undo();
      expect(tarea.state).toBe(TaskState.TODO);
    });

    it('debería revertir correctamente desde TESTING a IN_PROGRESS', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'proj-1', null, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);

      const command = new MoverTareaCommand(tarea, TaskState.TESTING);
      command.execute();
      expect(tarea.state).toBe(TaskState.TESTING);

      command.undo();
      expect(tarea.state).toBe(TaskState.IN_PROGRESS);
    });

    it('should record previousState correctly', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'proj-1', null, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);

      const command = new MoverTareaCommand(tarea, TaskState.TESTING);
      expect(command.previousState).toBe(TaskState.IN_PROGRESS);
    });
  });

  describe('toJSON()', () => {
    it('debería serializar para auditoría', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'proj-1', null, futureDate);
      const command = new MoverTareaCommand(tarea, TaskState.IN_PROGRESS);

      const log = command.toJSON();

      expect(log.type).toBe('MoverTareaCommand');
      expect(log.timestamp).toBeDefined();
      expect(log.data.taskId).toBe('t1');
      expect(log.data.fromState).toBe(TaskState.TODO);
      expect(log.data.toState).toBe(TaskState.IN_PROGRESS);
    });
  });
});