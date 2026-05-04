import { Usuario } from '../../../backend/src/domain/entities/Usuario';
import { UserRole } from '../../../shared/types/enums';

describe('Usuario (entidad de dominio)', () => {
  describe('Creación', () => {
    it('debería crear un usuario con rol por defecto MIEMBRO', () => {
      const user = new Usuario('u1', 'Ana García', 'ana@email.com');
      expect(user.id).toBe('u1');
      expect(user.name).toBe('Ana García');
      expect(user.role).toBe(UserRole.MIEMBRO);
    });

    it('debería crear un usuario con rol explícito', () => {
      const admin = new Usuario('u2', 'Admin', 'admin@email.com', UserRole.ADMIN);
      expect(admin.role).toBe(UserRole.ADMIN);
    });

    it('debería lanzar error si el nombre está vacío', () => {
      expect(() => {
        new Usuario('u1', '', 'email@test.com');
      }).toThrow('El nombre del usuario es requerido');
    });

    it('debería lanzar error si el email es inválido', () => {
      expect(() => {
        new Usuario('u1', 'Test', 'invalido');
      }).toThrow('Email inválido');
    });

    it('debería lanzar error si el email está vacío', () => {
      expect(() => {
        new Usuario('u1', 'Test', '');
      }).toThrow('Email inválido');
    });
  });

  describe('Métodos de comportamiento', () => {
    it('un LIDER puede asignar responsables', () => {
      const lider = new Usuario('u1', 'Líder', 'lider@email.com', UserRole.LIDER);
      expect(lider.puedeAsignarResponsables()).toBe(true);
    });

    it('un ADMIN puede asignar responsables', () => {
      const admin = new Usuario('u1', 'Admin', 'admin@email.com', UserRole.ADMIN);
      expect(admin.puedeAsignarResponsables()).toBe(true);
    });

    it('un MIEMBRO NO puede asignar responsables', () => {
      const miembro = new Usuario('u1', 'Miembro', 'miembro@email.com', UserRole.MIEMBRO);
      expect(miembro.puedeAsignarResponsables()).toBe(false);
    });

    it('esAdmin devuelve true solo para ADMIN', () => {
      const admin = new Usuario('u1', 'Admin', 'admin@email.com', UserRole.ADMIN);
      const lider = new Usuario('u2', 'Líder', 'lider@email.com', UserRole.LIDER);

      expect(admin.esAdmin()).toBe(true);
      expect(lider.esAdmin()).toBe(false);
    });

    it('equals compara por ID', () => {
      const user1 = new Usuario('u1', 'Ana', 'ana@email.com');
      const user2 = new Usuario('u1', 'Ana García', 'otro@email.com'); // Mismo ID, diferentes datos
      const user3 = new Usuario('u2', 'Ana', 'ana@email.com'); // Diferente ID

      expect(user1.equals(user2)).toBe(true);
      expect(user1.equals(user3)).toBe(false);
    });
  });
});