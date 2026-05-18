import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const flattened = (result.error as z.ZodError).flatten();
      res.status(400).json({ message: 'Validation failed', errors: flattened.fieldErrors || result.error.issues });
      return;
    }

    // Replace req.body with the parsed/coerced data so controllers receive correct types
    req.body = result.data as any;
    next();
  };
};