/**
 * Rutas para gestión de proyectos.
 * Usa ProyectoService y está protegida por autenticación.
 */
import { Router } from 'express';
import { ProyectoService } from '../../../application/services/ProyectoService';
import { AuthRequest, authMiddleware, checkRole } from '../middlewares/authMiddleware';
import { UserRole } from '../../../shared/types/enums';
import { i18n } from '../i18n/i18nManager';

export function proyectoRoutes(
  proyectoService: ProyectoService
): Router {
  const router = Router();

  // Aplicar middleware de autenticación a todas las rutas
  router.use(authMiddleware);

  /**
   * @swagger
   * /api/proyectos:
   *   post:
   *     summary: Crear un nuevo proyecto
   *     tags:
   *       - Proyectos
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       201:
   *         description: Proyecto creado exitosamente
   *       400:
   *         description: Datos inválidos
   *       401:
   *         description: No autenticado
   */
  router.post('/', async (req: AuthRequest, res) => {
    try {
      const { name, description } = req.body;
      const proyecto = await proyectoService.createProject({
        name,
        description
      });
      res.status(201).json({
        success: true,
        data: proyecto.toJSON(),
        message: i18n.t('es', 'proyecto.creado')
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/proyectos:
   *   get:
   *     summary: Listar proyectos activos del usuario
   *     tags:
   *       - Proyectos
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de proyectos
   */
  router.get('/', async (req: AuthRequest, res) => {
    try {
      const proyectos = await proyectoService.listActiveProjects();
      res.json({
        success: true,
        data: proyectos.map(p => p.toJSON())
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/proyectos/{id}:
   *   get:
   *     summary: Obtener un proyecto por ID
   *     tags:
   *       - Proyectos
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
   *         description: Proyecto encontrado
   *       404:
   *         description: Proyecto no encontrado
   */
  router.get('/:id', async (req: AuthRequest, res) => {
    try {
      const proyecto = await proyectoService.getProjectById(req.params.id);
      if (!proyecto) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }
      res.json({
        success: true,
        data: proyecto.toJSON()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/proyectos/{id}/archive:
   *   put:
   *     summary: Archivar un proyecto (solo ADMIN)
   *     tags:
   *       - Proyectos
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
   *         description: Proyecto archivado
   *       403:
   *         description: No autorizado
   */
  router.put(
    '/:id/archive',
    checkRole(UserRole.ADMIN),
    async (req: AuthRequest, res) => {
      try {
        const proyecto = await proyectoService.archiveProject(req.params.id);
        res.json({
          success: true,
          data: proyecto.toJSON(),
          message: i18n.t('es', 'proyecto.archivado')
        });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  return router;
}