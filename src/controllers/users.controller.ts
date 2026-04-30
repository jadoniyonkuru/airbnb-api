import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { createUserSchema, updateUserSchema } from "../validators/users.validator";
import { createProfileSchema, updateProfileSchema } from "../validators/profile.validator";
import { AuthRequest } from "../middleware/auth.middleware";

// GET /users
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: { select: { listings: true } }
      }
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// GET /users/:id
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 👇 no parseInt — id is now a string
    const id = req.params["id"] as string;

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.role === "HOST") {
      const hostWithListings = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          phone: true,
          role: true,
          avatar: true,
          bio: true,
          createdAt: true,
          listings: {
            include: {
              _count: { select: { bookings: true } }
            }
          }
        }
      });
      res.json(hostWithListings);
    } else {
      const guestWithBookings = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          phone: true,
          role: true,
          avatar: true,
          bio: true,
          createdAt: true,
          bookings: {
            include: {
              listing: {
                select: { title: true, location: true }
              }
            }
          }
        }
      });
      res.json(guestWithBookings);
    }
  } catch (error) {
    next(error);
  }
};

// POST /users
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = createUserSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.flatten().fieldErrors });
      return;
    }

    const { name, email, username, phone, role } = result.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: "Email already exists" });
      return;
    }

    if (!req.body.password) {
      res.status(400).json({ message: "password is required" });
      return;
    }

    const bcrypt = await import("bcrypt");
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = await prisma.user.create({
      data: { name, email, username, phone, role, password: hashedPassword }
    });

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

// PUT /users/:id
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 👇 no parseInt
    const id = req.params["id"] as string;

    const result = updateUserSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.flatten().fieldErrors });
      return;
    }

    const existing = await prisma.user.findFirst({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: result.data
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /users/:id
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 👇 no parseInt
    const id = req.params["id"] as string;

    const existing = await prisma.user.findFirst({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// GET /users/:id/profile
export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params["id"] as string;

    const profile = await prisma.profile.findUnique({
      where: { userId: id },
      include: { user: true }
    });

    if (!profile) {
      res.status(404).json({ message: "Profile not found" });
      return;
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
};

// POST /users/:id/profile
export const createUserProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params["id"] as string;

    const result = createProfileSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.flatten().fieldErrors });
      return;
    }

    const user = await prisma.user.findFirst({ where: { id } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const existing = await prisma.profile.findUnique({ where: { userId: id } });
    if (existing) {
      res.status(409).json({ message: "Profile already exists for this user" });
      return;
    }

    const profile = await prisma.profile.create({
      data: { userId: id, ...result.data }
    });

    res.status(201).json(profile);
  } catch (error) {
    next(error);
  }
};

// PUT /users/:id/profile
export const updateUserProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params["id"] as string;

    const result = updateProfileSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.flatten().fieldErrors });
      return;
    }

    const user = await prisma.user.findFirst({ where: { id } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const existing = await prisma.profile.findUnique({ where: { userId: id } });
    if (!existing) {
      res.status(404).json({ message: "Profile not found" });
      return;
    }

    const updated = await prisma.profile.update({
      where: { userId: id },
      data: result.data
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};