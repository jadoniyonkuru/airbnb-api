import { Request, Response } from "express";
import prisma from "../config/prisma";

// GET /users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: { select: { listings: true } }
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// GET /users/:id
export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      include: { listings: true, bookings: true }
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// POST /users
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, username, phone, role } = req.body;

    if (!name || !email || !username || !phone || !role) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: "Email already exists" });
      return;
    }

    const newUser = await prisma.user.create({
      data: { name, email, username, phone, role }
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// PUT /users/:id
export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.user.findFirst({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: req.body
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// DELETE /users/:id
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.user.findFirst({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};