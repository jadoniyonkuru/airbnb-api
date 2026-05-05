import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import crypto from "crypto";
import { sendEmail } from "../config/email";
import { welcomeEmail, passwordResetEmail } from "../emails";
const JWT_SECRET = process.env["JWT_SECRET"] as string;

// POST /auth/register
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, username, password, phone, role } = req.body;

    // validate required fields
    if (!name || !email || !username || !password || !phone) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // validate password length
    if (password.length < 8) {
      res.status(400).json({ message: "Password must be at least 8 characters" });
      return;
    }

    // never allow ADMIN role
    if (role === "ADMIN") {
      res.status(403).json({ message: "Cannot assign ADMIN role" });
      return;
    }

    // check email or username already taken
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
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
        role: role ?? "GUEST",
      }
    });

    // remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // send welcome email here — after user created, before response
    try {
      await sendEmail(
        email,
        "Welcome to Airbnb!",
        welcomeEmail(name)
      );
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // registration still succeeds even if email fails
    }

    // response sent after email attempt
    res.status(201).json(userWithoutPassword);

  } catch (error) {
    next(error);
  }
};

// POST /auth/login
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

// GET /auth/me
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.userId!;

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    let userWithDetails;

    if (user.role === "HOST") {
      userWithDetails = await prisma.user.findUnique({
        where: { id },
        include: {
          listings: {
            include: {
              _count: { select: { bookings: true } }
            }
          }
        }
      });
    } else {
      userWithDetails = await prisma.user.findUnique({
        where: { id },
        include: {
          bookings: {
            include: {
              listing: { select: { title: true, location: true } }
            }
          }
        }
      });
    }

    const { password: _, ...userWithoutPassword } = userWithDetails!;

    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

// POST /auth/change-password
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: "currentPassword and newPassword are required" });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Current password is incorrect" });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ message: "New password must be at least 8 characters" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.userId! },
      data: { password: hashedPassword }
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
};
// POST /auth/forgot-password
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    // always return same response — never reveal if email exists
    const successMessage = "If that email is registered, a reset link has been sent";

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.json({ message: successMessage });
      return;
    }

    // generate raw token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // hash before storing — never store raw tokens
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    // set expiry — 1 hour from now
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // save hashed token and expiry to user
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry
      }
    });

    // send password reset email
    const resetLink = `http://localhost:3000/auth/reset-password/${rawToken}`;
    try {
      console.log(`Attempting to send password reset email to ${email}`);
      await sendEmail(
        email,
        "Password Reset Request",
        passwordResetEmail(user.name, resetLink)
      );
      console.log(`Password reset email sent successfully to ${email}`);
    } catch (emailError) {
      console.error(`CRITICAL: Failed to send reset email to ${email}:`, emailError);
      console.error("Email error details:", {
        message: emailError instanceof Error ? emailError.message : String(emailError),
        stack: emailError instanceof Error ? emailError.stack : undefined
      });
    }

    res.json({ message: successMessage });
  } catch (error) {
    next(error);
  }
};

// POST /auth/reset-password/:token
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawToken = req.params["token"] as string;
    const { newPassword } = req.body;

    // hash the raw token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    // find user with matching token that hasn't expired
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() }  // token must not be expired
      }
    });

    // same message for both invalid and expired — never reveal which
    if (!user) {
      res.status(400).json({ message: "Invalid or expired reset token" });
      return;
    }

    // validate new password
    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({ message: "Password must be at least 8 characters" });
      return;
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // update password and clear token — one time use only
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};