import { IProyectoRepository } from '../../domain/ports/proyecto-repo';
import { Proyecto } from '../../domain/entities/proyecto';
import { Usuario } from '../../domain/entities/usuario';
import { getDatabase, transaction } from './sqlite-db';
import { UserRole } from '../../../shared/types/enums';

export class ProyectoRepositoryImpl implements IProyectoRepository {
  private rowToProyecto(row: any): Proyecto {
    const team: Usuario[] = row.team ? JSON.parse(row.team).map((u: any) =>
      new Usuario(u.id, u.name, u.email, u.role as UserRole)
    ) : [];

    return new Proyecto(
      row.id,
      row.name,
      row.description || '',
      team,
      row.archived === 1
    );
  }

  async save(proyecto: Proyecto): Promise<Proyecto> {
    return transaction(async (db) => {
      const data = proyecto.toJSON();

      await new Promise<void>((resolve, reject) => {
        db.run(
          `INSERT INTO proyectos (id, name, description, team, archived)
           VALUES (?, ?, ?, ?, ?)`,
          data.id,
          data.name,
          data.description,
          JSON.stringify(data.team),
          data.archived ? 1 : 0,
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      return proyecto;
    });
  }

  async findById(id: string): Promise<Proyecto | null> {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM proyectos WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row ? this.rowToProyecto(row) : null);
      });
    });
  }

  async findAll(includeArchived: boolean = false): Promise<Proyecto[]> {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM proyectos';
      const params: any[] = [];

      if (!includeArchived) {
        query += ' WHERE archived = 0';
      }

      query += ' ORDER BY createdAt DESC';

      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve((rows || []).map(row => this.rowToProyecto(row)));
      });
    });
  }

  async update(proyecto: Proyecto): Promise<Proyecto> {
    return transaction(async (db) => {
      const data = proyecto.toJSON();

      await new Promise<void>((resolve, reject) => {
        db.run(
          `UPDATE proyectos
           SET name=?, description=?, team=?, archived=?
           WHERE id=?`,
          data.name,
          data.description,
          JSON.stringify(data.team),
          data.archived ? 1 : 0,
          data.id,
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      return proyecto;
    });
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      db.run('DELETE FROM proyectos WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}