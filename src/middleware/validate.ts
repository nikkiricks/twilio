import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z, ZodError } from "zod";

interface ValidationSchemas {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

declare global {
  namespace Express {
    interface Request {
      validatedBody?: unknown;
      validatedParams?: unknown;
      validatedQuery?: unknown;
    }
  }
}

export interface ValidatedRequest<
  TBody = unknown,
  TParams = unknown,
  TQuery = unknown,
> extends Request {
  validatedBody: TBody;
  validatedParams: TParams;
  validatedQuery: TQuery;
}

function formatZodError(error: ZodError): { field: string; message: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "unknown",
    message: issue.message,
  }));
}

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: { field: string; message: string }[] = [];

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push(...formatZodError(result.error));
      } else {
        req.validatedParams = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.push(...formatZodError(result.error));
      } else {
        req.validatedQuery = result.data;
      }
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.push(...formatZodError(result.error));
      } else {
        req.validatedBody = result.data;
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
      return;
    }

    next();
  };
}
