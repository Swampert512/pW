import { Router } from 'express';
import { ITareaRepository } from '../../domain/ports/ITareaRepository';
import { CreateTaskUseCase } from '../../application/usecases/CreateTaskUseCase';
import { CrearTareaCommand } from '../../domain/commands/CrearTareaCommand';
import { Priority, TaskState } from '../../../shared/types/enums';

export function taskRoutes(createTaskUseCase: CreateTaskUseCase, tareaRepository: ITareaRepository): Router {
  const router = Router();

  // GET /api/tasks - Listar todas las tareas
  router.get('/', async (req, res) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const tasks = await tareaRepository.findAll(projectId);
      res.json(tasks.map(t => t.toJSON()));
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener tareas' });
    }
  });

  // POST /api/tasks - Crear tarea
  router.post('/', async (req, res) => {
    try {
      const { title, description, projectId, dueDate, priority } = req.body;
      const command = new CrearTareaCommand(
        title,
        description || '',
        projectId,
        new Date(dueDate),
        priority as Priority || Priority.MEDIA
      );
      const task = await createTaskUseCase.execute(command);
      res.status(201).json(task.toJSON());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // GET /api/tasks/:id - Obtener una tarea
  router.get('/:id', async (req, res) => {
    try {
      const task = await tareaRepository.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }
      res.json(task.toJSON());
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener la tarea' });
    }
  });

  // PATCH /api/tasks/:id - Actualizar tarea
  router.patch('/:id', async (req, res) => {
    try {
      const tarea = await tareaRepository.findById(req.params.id);
      if (!tarea) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      if (req.body.state) {
        tarea.cambiarEstado(req.body.state as TaskState);
      }
      if (req.body.priority) {
        tarea.cambiarPrioridad(req.body.priority as Priority);
      }
      if (req.body.comment) {
        tarea.agregarComentario(req.body.comment);
      }

      const updated = await tareaRepository.update(tarea);
      res.json(updated.toJSON());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // DELETE /api/tasks/:id - Eliminar tarea
  router.delete('/:id', async (req, res) => {
    try {
      await tareaRepository.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar la tarea' });
    }
  });

  return router;
}