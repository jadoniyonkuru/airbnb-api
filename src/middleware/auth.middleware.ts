import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env["JWT_SECRET"] as string;

// extend Request type so TypeScript knows about userId and role
export interface AuthRequest extends Request {
  userId?: number;
  role?: string;
}

// authenticate — verify JWT token
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];

    // check header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    // extract token
    const token = authHeader.split(" ")[1];

    // verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };

    // attach userId and role to request
    req.userId = decoded.userId;
    req.role = decoded.role;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// requireHost — only HOST or ADMIN
export const requireHost = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.role === "HOST" || req.role === "ADMIN") {
    next();
    return;
  }
  res.status(403).json({ message: "Access denied. Hosts only." });
};

// requireGuest — only GUEST or ADMIN
export const requireGuest = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.role === "GUEST" || req.role === "ADMIN") {
    next();
    return;
  }
  res.status(403).json({ message: "Access denied. Guests only." });
};

// requireAdmin — only ADMIN
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.role === "ADMIN") {
    next();
    return;
  }
  res.status(403).json({ message: "Access denied. Admins only." });
};