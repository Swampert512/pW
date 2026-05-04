/**
 * Rutas para comentarios en tareas
 */
import { Router } from 'express';
import { TareaService } from '../../../application/services/TareaService';
import { AuthRequest, authMiddleware } from '../middlewares/authMiddleware';
import { i18n } from '../i18n/i18nManager';

export function comentariosRoutes(tareaService: TareaService): Router {
  const router = Router();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/tareas/{id}/comments:
   *   post:
   *     summary: Agregar comentario a una tarea
   *     tags:
   *       - Comentarios
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
   *               text:
   *                 type: string
   *               fileName:
   *                 type: string
   *     responses:
   *       200:
   *         description: Comentario agregado
   */
  router.post('/:id/comments', async (req: AuthRequest, res) => {
    try {
      const { text, fileName } = req.body;

      if (!text?.trim()) {
        return res.status(400).json({ error: 'El comentario no puede estar vacío' });
      }

      // Construir comentario
      let comment = text.trim();
      if (fileName) {
        comment += ` (📎 ${fileName})`;
      }

      // En producción: guardar en BD
      // const tarea = await tareaService.addComment(req.params.id, comment);

      res.json({
        success: true,
        data: { comment, addedBy: req.user?.name, timestamp: new Date().toISOString() },
        message: i18n.t('es', 'comentarios.creado')
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
