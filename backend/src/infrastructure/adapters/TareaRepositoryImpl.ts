/**
 * Adaptador SQLite para ITareaRepository
 *
 * Implementa el puerto definido en domain/ports/ITareaRepository.
 * Gestiona la persistencia de tareas con soporte para transacciones.
 *
 * @class TareaRepositoryImpl
 */
import { ITareaRepository } from '../../../domain/ports/ITareaRepository';
import { Tarea } from '../../../domain/entities/Tarea';
import { Usuario } from '../../../domain/entities/Usuario';
import { TaskState, Priority, UserRole } from '../../../../shared/types/enums';
import { getDatabase, transaction } from './SQLiteDatabase';

export class TareaRepositoryImpl implements ITareaRepository {
  // --- Mapper privado ---

  private rowToTarea(row: any): Tarea {
    const responsible = row.responsibleId
      ? new Usuario(
          row.responsibleId,
          row.responsibleName || '',
          row.responsibleEmail || '',
          row.responsibleRole as UserRole
        )
      : null;

    return new Tarea(
      row.id,
      row.title,
      row.description || '',
      row.projectId,
      responsible,
      new Date(row.dueDate),
      row.priority as Priority,
      row.state as TaskState,
      JSON.parse(row.comments || '[]') as string[]
    );
  }

  // --- Métodos del puerto ---

  async save(tarea: Tarea): Promise<Tarea> {
    return transaction(async (db) => {
      const data = tarea.toJSON();

      await db.run(
        `INSERT INTO tareas
         (id, title, description, projectId, responsibleId, responsibleName, responsibleEmail, responsibleRole, dueDate, priority, state, comments)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        data.id,
        data.title,
        data.description,
        data.projectId,
        data.responsible?.id ?? null,
        data.responsible?.name ?? null,
        data.responsible?.email ?? null,
        data.responsible?.role ?? null,
        data.dueDate,
        data.priority,
        data.state,
        JSON.stringify(data.comments)
      );

      return tarea;
    });
  }

  async findById(id: string): Promise<Tarea | null> {
    const db = await getDatabase();
    const row = await db.get('SELECT * FROM tareas WHERE id = ?', id);
    return row ? this.rowToTarea(row) : null;
  }

  async findAll(projectId?: string): Promise<Tarea[]> {
    const db = await getDatabase();

    let query = 'SELECT * FROM tareas';
    const params: any[] = [];

    if (projectId) {
      query += ' WHERE projectId = ?';
      params.push(projectId);
    }

    query += ' ORDER BY dueDate ASC';

    const rows = await db.all(query, params);
    return rows.map((row: any) => this.rowToTarea(row));
  }

  async findByState(state: TaskState): Promise<Tarea[]> {
    const db = await getDatabase();
    const rows = await db.all(
      'SELECT * FROM tareas WHERE state = ? ORDER BY dueDate ASC',
      state
    );
    return rows.map((row: any) => this.rowToTarea(row));
  }

  async findByResponsible(userId: string): Promise<Tarea[]> {
    const db = await getDatabase();
    const rows = await db.all(
      `SELECT * FROM tareas
       WHERE responsibleId = ? AND state != ?
       ORDER BY dueDate ASC`,
      userId,
      TaskState.DONE
    );
    return rows.map((row: any) => this.rowToTarea(row));
  }

  async update(tarea: Tarea): Promise<Tarea> {
    return transaction(async (db) => {
      const data = tarea.toJSON();

      await db.run(
        `UPDATE tareas
         SET title=?, description=?, projectId=?, responsibleId=?, responsibleName=?, responsibleEmail=?, responsibleRole=?, dueDate=?, priority=?, state=?, comments=?
         WHERE id=?`,
        data.title,
        data.description,
        data.projectId,
        data.responsible?.id ?? null,
        data.responsible?.name ?? null,
        data.responsible?.email ?? null,
        data.responsible?.role ?? null,
        data.dueDate,
        data.priority,
        data.state,
        JSON.stringify(data.comments),
        data.id
      );

      return tarea;
    });
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.run('DELETE FROM tareas WHERE id = ?', id);
  }
}