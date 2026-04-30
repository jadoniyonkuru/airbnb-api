import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import multer from "multer";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // handle Multer file size error
  if (err instanceof multer.MulterError) {
    console.log(`[Error Handler] Multer error:`, err.code);
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ message: "File too large. Maximum size is 5MB" });
      return;
    }
    res.status(400).json({ message: err.message });
    return;
  }

  // handle file filter errors — wrong file type
  if (err instanceof Error && err.message.includes("Invalid file type")) {
    console.log(`[Error Handler] File type error:`, err.message);
    res.status(400).json({ message: err.message });
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({ errors: err.issues });
    return;
  }

  // Prisma known errors
  if (err instanceof Error && (err as any).code?.startsWith("P")) {
    const prismaErr = err as any;
    switch (prismaErr.code) {
      case "P2002":
        res.status(409).json({ error: `${prismaErr.meta?.target} already exists` });
        return;
      case "P2025":
        res.status(404).json({ error: "Record not found" });
        return;
      case "P2003":
        res.status(400).json({ error: "Related record does not exist" });
        return;
      default:
        res.status(500).json({ error: "Database error" });
        return;
    }
  }

  console.error("[Unhandled Error]", err instanceof Error ? err.message : err);
  res.status(500).json({ error: "Something went wrong", detail: err instanceof Error ? err.message : String(err) });
}