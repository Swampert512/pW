import { Proyecto } from '../../../backend/src/domain/entities/Proyecto';
import { Usuario } from '../../../backend/src/domain/entities/Usuario';
import { UserRole } from '../../../shared/types/enums';

describe('Proyecto (entidad de dominio)', () => {
  const usuario1 = new Usuario('u1', 'Ana', 'ana@email.com', UserRole.LIDER);
  const usuario2 = new Usuario('u2', 'Luis', 'luis@email.com', UserRole.MIEMBRO);

  describe('Creación', () => {
    it('debería crear un proyecto con equipo vacío', () => {
      const proyecto = new Proyecto('p1', 'Proyecto Alpha', 'Descripción');

      expect(proyecto.id).toBe('p1');
      expect(proyecto.name).toBe('Proyecto Alpha');
      expect(proyecto.team).toEqual([]);
      expect(proyecto.archived).toBe(false);
    });

    it('debería crear un proyecto con miembros iniciales', () => {
      const proyecto = new Proyecto('p1', 'Proyecto Beta', 'Desc', [usuario1, usuario2]);

      expect(proyecto.team.length).toBe(2);
      expect(proyecto.team[0].id).toBe('u1');
    });

    it('debería lanzar error si el nombre está vacío', () => {
      expect(() => {
        new Proyecto('p1', '', 'Desc');
      }).toThrow('Nombre de proyecto requerido');
    });
  });

  describe('Gestión de miembros', () => {
    it('debería agregar un miembro al equipo', () => {
      const proyecto = new Proyecto('p1', 'Proyecto', 'Desc');
      proyecto.agregarMiembro(usuario1);

      expect(proyecto.team.length).toBe(1);
      expect(proyecto.tieneMiembro('u1')).toBe(true);
    });

    it('NO debería agregar un miembro duplicado', () => {
      const proyecto = new Proyecto('p1', 'Proyecto', 'Desc', [usuario1]);

      expect(() => {
        proyecto.agregarMiembro(usuario1);
      }).toThrow('El usuario ya pertenece al equipo');
    });

    it('debería remover un miembro', () => {
      const proyecto = new Proyecto('p1', 'Proyecto', 'Desc', [usuario1, usuario2]);
      proyecto.removerMiembro('u1');

      expect(proyecto.team.length).toBe(1);
      expect(proyecto.tieneMiembro('u1')).toBe(false);
      expect(proyecto.tieneMiembro('u2')).toBe(true);
    });

    it('NO debería modificar miembros si el proyecto está archivado', () => {
      const proyecto = new Proyecto('p1', 'Proyecto', 'Desc', [usuario1]);
      proyecto.archivar();

      expect(() => {
        proyecto.agregarMiembro(usuario2);
      }).toThrow('No se puede modificar un proyecto archivado');

      expect(() => {
        proyecto.removerMiembro('u1');
      }).toThrow('No se puede modificar un proyecto archivado');
    });
  });

  describe('Archivado', () => {
    it('debería archivar un proyecto', () => {
      const proyecto = new Proyecto('p1', 'Proyecto', 'Desc');
      proyecto.archivar();
      expect(proyecto.archived).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('debería serializar correctamente', () => {
      const proyecto = new Proyecto('p1', 'Proyecto', 'Desc', [usuario1]);
      const json = proyecto.toJSON();

      expect(json.id).toBe('p1');
      expect(json.name).toBe('Proyecto');
      expect(json.team.length).toBe(1);
      expect(json.team[0].email).toBe('ana@email.com');
      expect(json.archived).toBe(false);
    });
  });
});