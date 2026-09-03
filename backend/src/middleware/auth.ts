import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthRequest, UserRole, JwtPayload } from '../types';

export class AuthError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export function authenticate(req: AuthRequest, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError(401, 'Access denied. No token provided.');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    throw new AuthError(401, 'Invalid or expired token.');
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, res: any, next: any) => {
    if (!req.user) {
      throw new AuthError(401, 'Access denied. Not authenticated.');
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      throw new AuthError(403, 'Access denied. Insufficient permissions.');
    }
    next();
  };
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as any);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}
