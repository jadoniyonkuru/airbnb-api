import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env["JWT_SECRET"] as string;

// 👇 userId is now string — was number
export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];

    // 👇 userId is now string
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

    req.userId = decoded.userId;
    req.role = decoded.role;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireHost = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.role === "HOST" || req.role === "ADMIN") {
    next();
    return;
  }
  res.status(403).json({ message: "Access denied. Hosts only." });
};

export const requireGuest = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.role === "GUEST" || req.role === "ADMIN") {
    next();
    return;
  }
  res.status(403).json({ message: "Access denied. Guests only." });
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.role === "ADMIN") {
    next();
    return;
  }
  res.status(403).json({ message: "Access denied. Admins only." });
};