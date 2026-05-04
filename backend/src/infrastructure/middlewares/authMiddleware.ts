/**
 * Middleware de autenticación JWT simple.
 * Valida el token y extrae la información del usuario.
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../../shared/types/enums';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

/**
 * Payload decodificado del JWT
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Middleware de autenticación.
 * Verifica el token JWT en el header Authorization.
 * Si es válido, adjunta el usuario al request.
 * Si no es válido, rechaza con 401.
 */
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token no proporcionado' });
    return;
  }

  const token = authHeader.substring(7); // Remover 'Bearer '

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role as UserRole
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * Middleware de autorización por roles.
 * Permite acceso solo si el usuario tiene uno de los roles especificados.
 *
 * @param allowedRoles - Roles permitidos
 * @returns Middleware function
 */
export function checkRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `No autorizado. Se requieren roles: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
}

/**
 * Genera un token JWT (útil para login/testing).
 */
export function generateToken(payload: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}