
/**
 * Adaptador SQLite para IProyectoRepository
 *
 * Implementa el puerto definido en domain/ports/IProyectoRepository.
 * Traduce las operaciones del dominio a consultas SQL.
 *
 * SRP: Solo se encarga de persistencia de proyectos.
 */
import { IProyectoRepository } from '../../../domain/ports/IProyectoRepository';
import { Proyecto } from '../../../domain/entities/Proyecto';
import { Usuario } from '../../../domain/entities/Usuario';
import { UserRole } from '../../../../shared/types/enums';
import { getDatabase, transaction } from './SQLiteDatabase';

export class ProyectoRepositoryImpl implements IProyectoRepository {
  // --- Mappers privados ---

  private rowToProyecto(row: any, team: Usuario[]): Proyecto {
    return new Proyecto(
      row.id,
      row.name,
      row.description || '',
      team,
      row.archived === 1
    );
  }

  private async getTeam(proyectoId: string): Promise<Usuario[]> {
    const db = await getDatabase();
    const rows = await db.all(
      `SELECT u.id, u.name, u.email, u.role
       FROM usuarios u
       INNER JOIN proyecto_usuarios pu ON u.id = pu.usuario_id
       WHERE pu.proyecto_id = ?`,
      proyectoId
    );
    return rows.map(
      (r: any) => new Usuario(r.id, r.name, r.email, r.role as UserRole)
        );
  }

  async save(proyecto: Proyecto): Promise<Proyecto> {
    return transaction(async (db) => {
      const data = proyecto.toJSON();

      await db.run(
        `INSERT INTO proyectos (id, name, description, archived)
         VALUES (?, ?, ?, ?)`,
        data.id,
        data.name,
        data.description,
        data.archived ? 1 : 0
      );

      // Insertar miembros del equipo
      for (const miembro of data.team) {
        await db.run(
          `INSERT OR IGNORE INTO proyecto_usuarios (proyecto_id, usuario_id)
           VALUES (?, ?)`,
          data.id,
          miembro.id
        );
      }

      return proyecto;
    });
  }

  async findById(id: string): Promise<Proyecto | null> {
    const db = await getDatabase();
    const row = await db.get(
      'SELECT * FROM proyectos WHERE id = ?',
      id
    );

    if (!row) return null;

    const team = await this.getTeam(id);
    return this.rowToProyecto(row, team);
  }

  async findAll(includeArchived: boolean = false): Promise<Proyecto[]> {
    const db = await getDatabase();

    let query = 'SELECT * FROM proyectos';
    if (!includeArchived) {
      query += ' WHERE archived = 0';
    }
    query += ' ORDER BY name ASC';

    const rows = await db.all(query);
    const proyectos: Proyecto[] = [];

    for (const row of rows) {
      const team = await this.getTeam(row.id);
      proyectos.push(this.rowToProyecto(row, team));
    }

    return proyectos;
  }

  async update(proyecto: Proyecto): Promise<Proyecto> {
    return transaction(async (db) => {
      const data = proyecto.toJSON();

      await db.run(
        `UPDATE proyectos
         SET name = ?, description = ?, archived = ?
         WHERE id = ?`,
        data.name,
        data.description,
        data.archived ? 1 : 0,
        data.id
      );

      // Reemplazar equipo: eliminar relaciones y volver a insertar
      await db.run(
        'DELETE FROM proyecto_usuarios WHERE proyecto_id = ?',
        data.id
      );

      for (const miembro of data.team) {
        await db.run(
          'INSERT INTO proyecto_usuarios (proyecto_id, usuario_id) VALUES (?, ?)',
          data.id,
          miembro.id
        );
      }

      return proyecto;
    });
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.run('DELETE FROM proyectos WHERE id = ?', id);
  }

  /**
   * Busca proyectos donde un usuario es miembro del equipo.
   * Método adicional útil para consultas.
   */
  async findByTeam(userId: string): Promise<Proyecto[]> {
    const db = await getDatabase();
    const rows = await db.all(
      `SELECT p.* FROM proyectos p
       INNER JOIN proyecto_usuarios pu ON p.id = pu.proyecto_id
       WHERE pu.usuario_id = ? AND p.archived = 0
       ORDER BY p.name ASC`,
      userId
    );

    const proyectos: Proyecto[] = [];
    for (const row of rows) {
      const team = await this.getTeam(row.id);
      proyectos.push(this.rowToProyecto(row, team));
    }

    return proyectos;
  }
}