import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Express middleware factory that validates a request property against a Zod schema.
 *
 * @param schema  — Zod schema to validate against
 * @param source  — Which part of the request to validate: 'body' | 'query' | 'params'
 *
 * @example
 *   router.post('/login', validate(loginSchema, 'body'), controller.login);
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source]);
      // Replace with parsed (coerced / defaulted) values so downstream code
      // gets clean typed data instead of raw strings from query params.
      (req as any)[source] = data;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: issues,
        });
      }
      next(err);
    }
  };
}
