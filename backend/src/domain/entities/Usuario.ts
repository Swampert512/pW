import { UserRole } from '../../../shared/types/enums';

/**
 * Entidad de dominio: Usuario
 *
 * SRP: Representa únicamente los datos y comportamiento de un usuario.
 * No tiene conocimiento de persistencia, UI ni infraestructura.
 *
 * Responsabilidades:
 * - Contener datos del usuario (id, nombre, email, rol)
 * - Validar su estado interno (ej: email no vacío)
 *
 * @class Usuario
 */
export class Usuario {
  public readonly id: string;
  public readonly name: string;
  public readonly email: string;
  public readonly role: UserRole;

  /**
   * Crea una instancia de Usuario con validaciones básicas
   * @param id - Identificador único
   * @param name - Nombre completo
   * @param email - Correo electrónico
   * @param role - Rol asignado (Miembro, Lider, Admin)
   * @throws {Error} Si algún campo requerido está vacío
   */
  constructor(
    id: string,
    name: string,
    email: string,
    role: UserRole = UserRole.MIEMBRO
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('El id del usuario es requerido');
    }
    if (!name || name.trim().length === 0) {
      throw new Error('El nombre del usuario es requerido');
    }
    if (!email || email.trim().length === 0 || !email.includes('@')) {
      throw new Error('Email inválido');
    }

    this.id = id;
    this.name = name.trim();
    this.email = email.trim();
    this.role = role;
  }

  // Métodos de comportamiento de dominio

  /**
   * Verifica si el usuario tiene permisos para asignar responsables
   * @returns {boolean} true si es LIDER o ADMIN
   */
  public puedeAsignarResponsables(): boolean {
    return this.role === UserRole.LIDER || this.role === UserRole.ADMIN;
  }

  /**
   * Verifica si es administrador del sistema
   * @returns {boolean}
   */
  public esAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Compara dos usuarios por identidad
   * @param otro - Otro usuario a comparar
   * @returns {boolean}
   */
  public equals(otro: Usuario): boolean {
    return this.id === otro.id;
  }
}