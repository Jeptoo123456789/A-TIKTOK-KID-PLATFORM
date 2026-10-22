/**
 * KinVid Safe Error Handling Middleware
 * Prevents sensitive stack trace leakage, provides consistent API error responses,
 * and logs issues safely.
 */

import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');

  console.error(`[API Error] ${req.method} ${req.url} [${statusCode}]:`, err.message);

  // In production, never leak raw internal stack traces to clients
  const responsePayload = {
    success: false,
    error: errorCode,
    message: statusCode >= 500 ? 'An unexpected server error occurred. Please try again later.' : err.message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    details: err.details || undefined,
  };

  res.status(statusCode).json(responsePayload);
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `API endpoint '${req.method} ${req.originalUrl}' does not exist.`,
    timestamp: new Date().toISOString(),
  });
}
