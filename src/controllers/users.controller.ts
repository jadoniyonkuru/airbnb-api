import { Request, Response } from "express";
import { users, User } from "../models/user.model";

export const getAllUsers = (req: Request, res: Response) => {
  res.json(users);
};

export const getUserById = (req: Request, res: Response) => {
  const user = users.find((u) => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

export const createUser = (req: Request, res: Response) => {
  const { name, email, username, phone, role } = req.body;
  if (!name || !email || !username || !phone || !role)
    return res.status(400).json({ message: "Missing required fields: name, email, username, phone, role" });

  if (users.some((u) => u.email === email))
    return res.status(409).json({ message: "Email already in use" });

  const newUser: User = { id: users.length + 1, name, email, username, phone, role, avatar: req.body.avatar, bio: req.body.bio };
  users.push(newUser);
  res.status(201).json(newUser);
};

export const updateUser = (req: Request, res: Response) => {
  const index = users.findIndex((u) => u.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: "User not found" });

  if (req.body.email && users.some((u) => u.email === req.body.email && u.id !== users[index].id))
    return res.status(409).json({ message: "Email already in use" });

  users[index] = { ...users[index], ...req.body, id: users[index].id };
  res.json(users[index]);
};

export const deleteUser = (req: Request, res: Response) => {
  const index = users.findIndex((u) => u.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: "User not found" });

  const deleted = users.splice(index, 1)[0];
  res.json({ message: "User deleted", user: deleted });
};
