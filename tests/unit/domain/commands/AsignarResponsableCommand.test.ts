import { AsignarResponsableCommand } from '../../../../backend/src/domain/commands/AsignarResponsableCommand';
import { Tarea } from '../../../../backend/src/domain/entities/Tarea';
import { Usuario } from '../../../../backend/src/domain/entities/Usuario';
import { TaskState, UserRole } from '../../../../shared/types/enums';

describe('AsignarResponsableCommand', () => {
  const futureDate = new Date('2025-12-31');
  const usuarioAna = new Usuario('u1', 'Ana', 'ana@email.com', UserRole.MIEMBRO);
  const usuarioLuis = new Usuario('u2', 'Luis', 'luis@email.com', UserRole.MIEMBRO);

  describe('execute()', () => {
    it('debería asignar un responsable a la tarea', () => {
      const tarea = new Tarea('t1', 'Título', 'Desc', 'proj-1', null, futureDate);
      const command = new AsignarResponsableCommand(tarea, usuarioAna);

      command.execute();

      expect(tarea.responsible).toEqual(usuarioAna);
    });

    it('debería reemplazar un responsable existente', () => {
      const tarea = new Tarea('t1', 'Título', 'Desc', 'proj-1', usuarioAna, futureDate);
      const command = new AsignarResponsableCommand(tarea, usuarioLuis);

      command.execute();

      expect(tarea.responsible).toEqual(usuarioLuis);
    });

    it('no debería asignar si la tarea está DONE', () => {
      const tarea = new Tarea('t1', 'Título', 'Desc', 'proj-1', null, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);
      tarea.cambiarEstado(TaskState.TESTING);
      tarea.cambiarEstado(TaskState.DONE);

      const command = new AsignarResponsableCommand(tarea, usuarioAna);

      expect(() => command.execute()).toThrow('No se puede asignar responsable a una tarea completada');
    });
  });

  describe('undo()', () => {
    it('debería revertir la asignación al responsable anterior', () => {
      const tarea = new Tarea('t1', 'Título', 'Desc', 'proj-1', usuarioAna, futureDate);
      const command = new AsignarResponsableCommand(tarea, usuarioLuis);

      command.execute();
      expect(tarea.responsible).toEqual(usuarioLuis);

      command.undo();
      expect(tarea.responsible).toEqual(usuarioAna);
    });

    it('debería dejar sin responsable si no había anterior', () => {
      const tarea = new Tarea('t1', 'Título', 'Desc', 'proj-1', null, futureDate);
      const command = new AsignarResponsableCommand(tarea, usuarioAna);

      command.execute();
      expect(tarea.responsible).toEqual(usuarioAna);

      command.undo();
      expect(tarea.responsible).toBeNull();
    });

    it('debería registrar previousResponsible correctamente', () => {
      const tarea = new Tarea('t1', 'Título', 'Desc', 'proj-1', usuarioAna, futureDate);
      const command = new AsignarResponsableCommand(tarea, usuarioLuis);

      expect(command.previousResponsible).toEqual(usuarioAna);
    });
  });

  describe('toJSON()', () => {
    it('debería serializar para auditoría', () => {
      const tarea = new Tarea('t1', 'Título', 'Desc', 'proj-1', null, futureDate);
      const command = new AsignarResponsableCommand(tarea, usuarioAna);

      const log = command.toJSON();

      expect(log.type).toBe('AsignarResponsableCommand');
      expect(log.timestamp).toBeDefined();
      expect(log.data.taskId).toBe('t1');
      expect(log.data.previousResponsibleId).toBeNull();
      expect(log.data.newResponsibleId).toBe('u1');
    });
  });
});