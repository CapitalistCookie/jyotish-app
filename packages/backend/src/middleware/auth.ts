import { Request, Response, NextFunction } from 'express';

/**
 * Auth middleware (placeholder)
 * TODO: Implement JWT verification
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'No authorization header',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      error: 'No token provided',
    });
    return;
  }

  // TODO: Verify JWT token
  // For now, just pass through
  next();
}

/**
 * Optional auth middleware - doesn't require auth but attaches user if present
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    // TODO: Verify and attach user
  }

  next();
}
