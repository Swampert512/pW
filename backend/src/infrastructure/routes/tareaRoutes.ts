/**
 * Rutas para gestión de tareas.
 * Usa TareaService y está protegida por autenticación.
 */
import { Router } from 'express';
import { TareaService } from '../../../application/services/TareaService';
import { AuthRequest, authMiddleware } from '../middlewares/authMiddleware';
import { CrearTareaCommand } from '../../../domain/commands/CrearTareaCommand';
import { MoverTareaCommand } from '../../../domain/commands/MoverTareaCommand';
import { AsignarResponsableCommand } from '../../../domain/commands/AsignarResponsableCommand';
import { Usuario } from '../../../domain/entities/Usuario';
import { Priority, TaskState, UserRole } from '../../../shared/types/enums';
import { i18n } from '../i18n/i18nManager';

export function tareaRoutes(tareaService: TareaService): Router {
  const router = Router();

  // Aplicar middleware de autenticación
  router.use(authMiddleware);

  /**
   * @swagger
   * /api/tareas:
   *   post:
   *     summary: Crear una nueva tarea
   *     tags:
   *       - Tareas
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - projectId
   *               - dueDate
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               projectId:
   *                 type: string
   *               dueDate:
   *                 type: string
   *                 format: date-time
   *               priority:
   *                 type: string
   *                 enum: [BAJA, MEDIA, ALTA]
   *     responses:
   *       201:
   *         description: Tarea creada
   *       400:
   *         description: Datos inválidos
   */
  router.post('/', async (req: AuthRequest, res) => {
    try {
      const { title, description, projectId, dueDate, priority } = req.body;

      const command = new CrearTareaCommand(
        title,
        description || '',
        projectId,
        new Date(dueDate),
        priority as Priority || Priority.MEDIA
      );

      const tarea = await tareaService.createTask(command);

      res.status(201).json({
        success: true,
        data: tarea.toJSON(),
        message: i18n.t('es', 'tarea.creada')
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/tareas:
   *   get:
   *     summary: Listar tareas (opcionalmente filtradas por proyecto)
   *     tags:
   *       - Tareas
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: projectId
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Lista de tareas
   */
  router.get('/', async (req: AuthRequest, res) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const tareas = await tareaService.listTasks(projectId);

      res.json({
        success: true,
        data: tareas.map(t => t.toJSON())
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/tareas/{id}:
   *   get:
   *     summary: Obtener una tarea por ID
   *     tags:
   *       - Tareas
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Tarea encontrada
   *       404:
   *         description: Tarea no encontrada
   */
  router.get('/:id', async (req: AuthRequest, res) => {
    try {
      const tarea = await tareaService.listTasks();
      const found = tarea.find(t => t.id === req.params.id);

      if (!found) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      res.json({
        success: true,
        data: found.toJSON()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/tareas/{id}/move:
   *   put:
   *     summary: Mover tarea a un nuevo estado
   *     tags:
   *       - Tareas
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               state:
   *                 type: string
   *                 enum: [TODO, IN_PROGRESS, TESTING, DONE]
   *     responses:
   *       200:
   *         description: Estado actualizado
   *       400:
   *         description: Transición inválida o tarea sin responsable
   */
  router.put('/:id/move', async (req: AuthRequest, res) => {
    try {
      const { state } = req.body;
      const tareas = await tareaService.listTasks();
      const tarea = tareas.find(t => t.id === req.params.id);

      if (!tarea) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      const command = new MoverTareaCommand(tarea, state as TaskState);
      const updated = await tareaService.moveTask(command);

      res.json({
        success: true,
        data: updated.toJSON(),
        message: i18n.t('es', 'tarea.movida')
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/tareas/{id}/assign:
   *   put:
   *     summary: Asignar responsable a una tarea
   *     tags:
   *       - Tareas
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               responsibleId:
   *                 type: string
   *               responsibleName:
   *                 type: string
   *               responsibleEmail:
   *                 type: string
   *               responsibleRole:
   *                 type: string
   *     responses:
   *       200:
   *         description: Responsable asignado
   *       400:
   *         description: Error de validación
   */
  router.put('/:id/assign', async (req: AuthRequest, res) => {
    try {
      const { responsibleId, responsibleName, responsibleEmail, responsibleRole } = req.body;

      const tareas = await tareaService.listTasks();
      const tarea = tareas.find(t => t.id === req.params.id);

      if (!tarea) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      const usuario = new Usuario(
        responsibleId,
        responsibleName,
        responsibleEmail,
        responsibleRole as UserRole
      );

      const command = new AsignarResponsableCommand(tarea, usuario);
      const updated = await tareaService.assignResponsible(command);

      res.json({
        success: true,
        data: updated.toJSON(),
        message: i18n.t('es', 'tarea.asignada')
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/tareas/{id}:
   *   delete:
   *     summary: Eliminar una tarea
   *     tags:
   *       - Tareas
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Tarea eliminada
   */
  router.delete('/:id', async (req: AuthRequest, res) => {
    try {
      await tareaService.deleteTask(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/tareas/proyecto/{projectId}/dashboard:
   *   get:
   *     summary: Obtener estadísticas del dashboard de un proyecto
   *     tags:
   *       - Tareas
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: projectId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Estadísticas del dashboard
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 tasksByState:
   *                   type: object
   *                 overdueTasks:
   *                   type: array
   *                 loadByUser:
   *                   type: object
   *                 totalTasks:
   *                   type: number
   */
  router.get('/proyecto/:projectId/dashboard', async (req: AuthRequest, res) => {
    try {
      const stats = await tareaService.getDashboardStats(req.params.projectId);
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}