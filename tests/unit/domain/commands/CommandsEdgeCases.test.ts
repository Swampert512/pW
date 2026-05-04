/**
 * Tests de edge cases para Commands - Reglas de dominio críticas
 *
 * Los Commands son cruciales porque:
 * 1. Encapsulan validación de entrada
 * 2. Construyen entidades válidas
 * 3. Permiten auditoría de cada operación
 * 4. Soportan undo/redo
 *
 * Por qué testear aquí y no en la aplicación:
 * - Las reglas de dominio deben cumplirse SIEMPRE
 * - Los tests de application confían en que domain es correcto
 * - Si dominio falla, toda la app falla
 */
import { CrearTareaCommand } from '../../../../backend/src/domain/commands/CrearTareaCommand';
import { MoverTareaCommand } from '../../../../backend/src/domain/commands/MoverTareaCommand';
import { AsignarResponsableCommand } from '../../../../backend/src/domain/commands/AsignarResponsableCommand';
import { Tarea } from '../../../../backend/src/domain/entities/Tarea';
import { Usuario } from '../../../../backend/src/domain/entities/Usuario';
import { Priority, TaskState, UserRole } from '../../../../shared/types/enums';

describe('Commands - Edge Cases y Reglas de Dominio', () => {
  const futureDate = new Date('2025-12-31');
  const pastDate = new Date('2024-01-01');
  const usuario = new Usuario('u1', 'Ana', 'ana@email.com', UserRole.MIEMBRO);

  describe('CrearTareaCommand - Validaciones críticas', () => {
    it('debería rechazar dueDate exactamente HOY (no futura)', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const command = new CrearTareaCommand(
        'Tarea',
        'Desc',
        'proj-1',
        today // ← Hoy, no futuro
      );

      expect(() => command.execute()).toThrow('debe ser futura');
    });

    it('debería aceptar dueDate 1 segundo en el futuro', () => {
      const futuro1s = new Date(Date.now() + 1000);

      const command = new CrearTareaCommand(
        'Tarea',
        'Desc',
        'proj-1',
        futuro1s
      );

      expect(() => command.execute()).not.toThrow();
    });

    it('debería rechazar título solo con espacios', () => {
      const command = new CrearTareaCommand(
        '   \t\n   ', // Solo whitespace
        'Desc',
        'proj-1',
        futureDate
      );

      expect(() => command.execute()).toThrow('requerido');
    });

    it('debería generar IDs únicos en cada ejecución', () => {
      const cmd1 = new CrearTareaCommand('T1', 'D', 'proj-1', futureDate);
      const cmd2 = new CrearTareaCommand('T1', 'D', 'proj-1', futureDate);

      const t1 = cmd1.execute();
      const t2 = cmd2.execute();

      expect(t1.id).not.toBe(t2.id);
    });

    it('debería permitir descripción vacía', () => {
      const command = new CrearTareaCommand(
        'Título',
        '',
        'proj-1',
        futureDate
      );

      const tarea = command.execute();
      expect(tarea.description).toBe('');
    });

    it('debería permitir responsable nulo', () => {
      const command = new CrearTareaCommand(
        'Título',
        'Desc',
        'proj-1',
        futureDate,
        Priority.MEDIA,
        null // Sin responsable
      );

      const tarea = command.execute();
      expect(tarea.responsible).toBeNull();
    });

    it('debería iniciarse siempre en estado TODO', () => {
      const command = new CrearTareaCommand(
        'Tarea',
        'Desc',
        'proj-1',
        futureDate
      );

      const tarea = command.execute();
      expect(tarea.state).toBe(TaskState.TODO);
    });
  });

  describe('MoverTareaCommand - Transiciones prohibidas', () => {
    it('NO debería permitir TODO → TESTING (saltarse IN_PROGRESS)', () => {
      const tarea = new Tarea('t1', 'T', 'D', 'proj-1', null, futureDate);
      const command = new MoverTareaCommand(tarea, TaskState.TESTING);

      expect(() => command.execute()).toThrow('Transición inválida');
    });

    it('NO debería permitir TODO → DONE (directamente)', () => {
      const tarea = new Tarea('t1', 'T', 'D', 'proj-1', null, futureDate);
      const command = new MoverTareaCommand(tarea, TaskState.DONE);

      expect(() => command.execute()).toThrow('Transición inválida');
    });

    it('NO debería permitir TESTING → TODO (retroceso a TODO)', () => {
      const tarea = new Tarea('t1', 'T', 'D', 'proj-1', null, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);
      tarea.cambiarEstado(TaskState.TESTING);

      const command = new MoverTareaCommand(tarea, TaskState.TODO);

      expect(() => command.execute()).toThrow('Transición inválida');
    });

    it('NO debería permitir DONE → ningún estado (terminal)', () => {
      const tarea = new Tarea('t1', 'T', 'D', 'proj-1', null, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);
      tarea.cambiarEstado(TaskState.TESTING);
      tarea.cambiarEstado(TaskState.DONE);

      expect(() => {
        new MoverTareaCommand(tarea, TaskState.IN_PROGRESS).execute();
      }).toThrow('Transición inválida');
    });

    it('debería permitir camino válido: TODO → IN_PROGRESS → TESTING → DONE', () => {
      const tarea = new Tarea('t1', 'T', 'D', 'proj-1', usuario, futureDate);

      expect(() => {
        const cmd1 = new MoverTareaCommand(tarea, TaskState.IN_PROGRESS);
        cmd1.execute();
        const cmd2 = new MoverTareaCommand(tarea, TaskState.TESTING);
        cmd2.execute();
        const cmd3 = new MoverTareaCommand(tarea, TaskState.DONE);
        cmd3.execute();
      }).not.toThrow();

      expect(tarea.state).toBe(TaskState.DONE);
    });

    it('debería permitir IN_PROGRESS → TODO (retroceso)', () => {
      const tarea = new Tarea('t1', 'T', 'D', 'proj-1', null, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);

      const command = new MoverTareaCommand(tarea, TaskState.TODO);
      expect(() => command.execute()).not.toThrow();
    });
  });

  describe('MoverTareaCommand - Undo', () => {
    it('debería restaurar estado anterior con undo()', () => {
      const tarea = new Tarea('t1', 'T', 'D', 'proj-1', null, futureDate);
      expect(tarea.state).toBe(TaskState.TODO);

      const command = new MoverTareaCommand(tarea, TaskState.IN_PROGRESS);
      command.execute();
      expect(tarea.state).toBe(TaskState.IN_PROGRESS);

      command.undo();
      expect(tarea.state).toBe(TaskState.TODO);
    });

    it('debería guardar previousState antes de ejecutar', () => {
      const tarea = new Tarea('t1', 'T', 'D', 'proj-1', null, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);

      const command = new MoverTareaCommand(tarea, TaskState.TESTING);
      expect(command.previousState).toBe(TaskState.IN_PROGRESS);
    });
  });

  describe('AsignarResponsableCommand - Reglas críticas', () => {
    it('NO debería asignar a tarea DONE', () => {
      const tarea = new Tarea('t1', 'T', 'D', 'proj-1', null, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);
      tarea.cambiarEstado(TaskState.TESTING);
      tarea.cambiarEstado(TaskState.DONE);

      const command = new AsignarResponsableCommand(tarea, usuario);

      expect(() => command.execute()).toThrow('completada');
    });

    it('debería asignar a tarea TODO', () => {
      const tarea = new Tarea('t1', 'T', 'D', 'proj-1', null, futureDate);
      const command = new AsignarResponsableCommand(tarea, usuario);

      expect(() => command.execute()).not.toThrow();
      expect(tarea.responsible).toBe(usuario);
    });

    it('debería permitir cambiar responsable (reemplazar)', () => {
      const usuario2 = new Usuario('u2', 'Luis', 'luis@email.com', UserRole.MIEMBRO);
      const tarea = new Tarea('t1', 'T', 'D', 'proj-1', usuario, futureDate);

      const command = new AsignarResponsableCommand(tarea, usuario2);
      command.execute();

      expect(tarea.responsible).toBe(usuario2);
    });

    it('debería restaurar responsable anterior con undo()', () => {
      const usuario2 = new Usuario('u2', 'Luis', 'luis@email.com', UserRole.MIEMBRO);
      const tarea = new Tarea('t1', 'T', 'D', 'proj-1', usuario, futureDate);

      const command = new AsignarResponsableCommand(tarea, usuario2);
      command.execute();
      expect(tarea.responsible).toBe(usuario2);

      command.undo();
      expect(tarea.responsible).toBe(usuario);
    });

    it('debería restaurar a null si no había responsable anterior', () => {
      const tarea = new Tarea('t1', 'T', 'D', 'proj-1', null, futureDate);

      const command = new AsignarResponsableCommand(tarea, usuario);
      command.execute();
      expect(tarea.responsible).toBe(usuario);

      command.undo();
      expect(tarea.responsible).toBeNull();
    });
  });

  describe('Command auditoría (toJSON)', () => {
    it('CrearTareaCommand debería incluir timestamp', () => {
      const before = new Date();
      const command = new CrearTareaCommand('T', 'D', 'p1', futureDate);
      const after = new Date();

      const log = command.toJSON();

      expect(log.timestamp).toBeDefined();
      const timestamp = new Date(log.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('MoverTareaCommand debería registrar transición', () => {
      const tarea = new Tarea('t1', 'T', 'D', 'proj-1', null, futureDate);
      const command = new MoverTareaCommand(tarea, TaskState.IN_PROGRESS);

      const log = command.toJSON();

      expect(log.type).toBe('MoverTareaCommand');
      expect(log.data.fromState).toBe(TaskState.TODO);
      expect(log.data.toState).toBe(TaskState.IN_PROGRESS);
      expect(log.data.taskId).toBe('t1');
    });

    it('AsignarResponsableCommand debería registrar responsables', () => {
      const tarea = new Tarea('t1', 'T', 'D', 'proj-1', null, futureDate);
      const command = new AsignarResponsableCommand(tarea, usuario);

      const log = command.toJSON();

      expect(log.type).toBe('AsignarResponsableCommand');
      expect(log.data.previousResponsibleId).toBeNull();
      expect(log.data.newResponsibleId).toBe('u1');
    });
  });
});