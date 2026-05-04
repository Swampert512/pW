/**
 * Rutas para gestión de usuarios (solo ADMIN)
 */
import { Router } from 'express';
import { AuthRequest, authMiddleware, checkRole } from '../middlewares/authMiddleware';
import { UserRole } from '../../../shared/types/enums';
import { i18n } from '../i18n/i18nManager';

export function usuariosRoutes(): Router {
  const router = Router();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/usuarios:
   *   get:
   *     summary: Listar todos los usuarios (solo ADMIN)
   *     tags:
   *       - Usuarios
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de usuarios
   *       403:
   *         description: Solo ADMIN puede ver usuarios
   */
  router.get(
    '/',
    checkRole(UserRole.ADMIN),
    async (req: AuthRequest, res) => {
      try {
        // Mock de usuarios
        const usuarios = [
          {
            id: 'u1',
            name: 'Ana García',
            email: 'ana@email.com',
            role: 'LIDER'
          },
          {
            id: 'u2',
            name: 'Luis López',
            email: 'luis@email.com',
            role: 'MIEMBRO'
          },
          {
            id: 'u3',
            name: 'Carmen Rodríguez',
            email: 'carmen@email.com',
            role: 'MIEMBRO'
          },
          {
            id: 'u-admin',
            name: 'Admin User',
            email: 'admin@email.com',
            role: 'ADMIN'
          }
        ];

        res.json({
          success: true,
          data: usuarios
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * @swagger
   * /api/usuarios/{id}:
   *   put:
   *     summary: Actualizar rol de usuario (solo ADMIN)
   *     tags:
   *       - Usuarios
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
   *               role:
   *                 type: string
   *                 enum: [MIEMBRO, LIDER, ADMIN]
   *     responses:
   *       200:
   *         description: Usuario actualizado
   */
  router.put(
    '/:id',
    checkRole(UserRole.ADMIN),
    async (req: AuthRequest, res) => {
      try {
        const { role } = req.body;

        if (!['MIEMBRO', 'LIDER', 'ADMIN'].includes(role)) {
          return res.status(400).json({ error: 'Rol inválido' });
        }

        // En producción: actualizar en BD
        res.json({
          success: true,
          data: { id: req.params.id, role },
          message: i18n.t('es', 'usuario.actualizado')
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  return router;
}
