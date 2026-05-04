import { Tarea } from '../../../backend/src/domain/entities/Tarea';
import { Usuario } from '../../../backend/src/domain/entities/Usuario';
import { Priority, TaskState, UserRole } from '../../../shared/types/enums';

describe('Tarea (entidad de dominio)', () => {
  const futureDate = new Date('2025-12-31');
  const usuario = new Usuario('u1', 'Ana', 'ana@email.com', UserRole.MIEMBRO);

  describe('Creación', () => {
    it('debería crear una tarea con valores por defecto', () => {
      const tarea = new Tarea(
        't1',
        'Mi tarea',
        'Descripción',
        'p1',
        null,
        futureDate
      );

      expect(tarea.id).toBe('t1');
      expect(tarea.title).toBe('Mi tarea');
      expect(tarea.state).toBe(TaskState.TODO);
      expect(tarea.priority).toBe(Priority.MEDIA);
      expect(tarea.responsible).toBeNull();
      expect(tarea.comments).toEqual([]);
    });

    it('debería lanzar error si el título está vacío', () => {
      expect(() => {
        new Tarea('t1', '', 'Desc', 'p1', null, futureDate);
      }).toThrow('Título de tarea requerido');
    });

    it('debería lanzar error si la fecha es inválida', () => {
      expect(() => {
        new Tarea('t1', 'Title', 'Desc', 'p1', null, new Date('invalid'));
      }).toThrow('Fecha de vencimiento inválida');
    });
  });

  describe('Transiciones de estado (TaskState)', () => {
    it('debería permitir TODO → IN_PROGRESS', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'p1', null, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);
      expect(tarea.state).toBe(TaskState.IN_PROGRESS);
    });

    it('debería permitir IN_PROGRESS → TESTING', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'p1', null, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);
      tarea.cambiarEstado(TaskState.TESTING);
      expect(tarea.state).toBe(TaskState.TESTING);
    });

    it('debería permitir IN_PROGRESS → TODO (retroceder)', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'p1', null, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);
      tarea.cambiarEstado(TaskState.TODO);
      expect(tarea.state).toBe(TaskState.TODO);
    });

    it('debería permitir TESTING → DONE', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'p1', null, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);
      tarea.cambiarEstado(TaskState.TESTING);
      tarea.cambiarEstado(TaskState.DONE);
      expect(tarea.state).toBe(TaskState.DONE);
    });

    it('NO debería permitir TODO → DONE (salto inválido)', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'p1', null, futureDate);
      expect(() => {
        tarea.cambiarEstado(TaskState.DONE);
      }).toThrow('Transición inválida');
    });

    it('NO debería permitir DONE → ningún estado (terminal)', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'p1', null, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);
      tarea.cambiarEstado(TaskState.TESTING);
      tarea.cambiarEstado(TaskState.DONE);

      expect(() => {
        tarea.cambiarEstado(TaskState.IN_PROGRESS);
      }).toThrow('Transición inválida');
    });

    it('NO debería permitir TODO → TESTING', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'p1', null, futureDate);
      expect(() => {
        tarea.cambiarEstado(TaskState.TESTING);
      }).toThrow('Transición inválida');
    });
  });

  describe('Asignación de responsable', () => {
    it('debería asignar un responsable válido', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'p1', null, futureDate);
      tarea.asignarResponsable(usuario);
      expect(tarea.responsible).toBeDefined();
      expect(tarea.responsible!.id).toBe('u1');
      expect(tarea.responsible!.name).toBe('Ana');
    });

    it('NO debería asignar responsable si la tarea está DONE', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'p1', null, futureDate);
      tarea.cambiarEstado(TaskState.IN_PROGRESS);
      tarea.cambiarEstado(TaskState.TESTING);
      tarea.cambiarEstado(TaskState.DONE);

      expect(() => {
        tarea.asignarResponsable(usuario);
      }).toThrow('No se puede asignar responsable a una tarea completada');
    });
  });

  describe('Comentarios', () => {
    it('debería agregar comentarios', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'p1', null, futureDate);
      tarea.agregarComentario('Primer comentario');
      tarea.agregarComentario('Segundo');

      expect(tarea.comments.length).toBe(2);
      expect(tarea.comments[0]).toBe('Primer comentario');
    });

    it('NO debería agregar comentarios vacíos', () => {
      const tarea = new Tarea('t1', 'Title', 'Desc', 'p1', null, futureDate);
      expect(() => {
        tarea.agregarComentario('');
      }).toThrow('El comentario no puede estar vacío');
    });
  });

  describe('toJSON', () => {
    it('debería serializar correctamente', () => {
      const tarea = new Tarea(
        't1',
        'Title',
        'Desc',
        'p1',
        usuario,
        futureDate,
        Priority.ALTA
      );

      const json = tarea.toJSON();

      expect(json.id).toBe('t1');
      expect(json.title).toBe('Title');
      expect(json.responsible).toBeDefined();
      expect(json.responsible!.id).toBe('u1');
      expect(json.priority).toBe(Priority.ALTA);
      expect(json.state).toBe(TaskState.TODO);
      expect(json.comments).toEqual([]);
    });
  });
});