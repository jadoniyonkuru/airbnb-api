import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";

const JWT_SECRET = process.env["JWT_SECRET"] as string;
const JWT_EXPIRES_IN = process.env["JWT_EXPIRES_IN"] as string;

// POST /auth/register
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, username, password, phone, role } = req.body;

    // validate required fields
    if (!name || !email || !username || !password || !phone) {
      res.status(400).json({ message: "All fields are required: name, email, username, password, phone" });
      return;
    }

    // validate password length
    if (password.length < 8) {
      res.status(400).json({ message: "Password must be at least 8 characters" });
      return;
    }

    // never allow ADMIN role through API
    if (role === "ADMIN") {
      res.status(403).json({ message: "Cannot assign ADMIN role" });
      return;
    }

    // check email or username already taken
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existing) {
      res.status(409).json({ message: "Email or username already taken" });
      return;
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        phone,
        password: hashedPassword,
        role: role ?? "GUEST",  //  default to GUEST if not provided
      }
    });

    // remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

// POST /auth/login
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // validate fields
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    // always return same message — don't reveal if email exists
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // sign JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};