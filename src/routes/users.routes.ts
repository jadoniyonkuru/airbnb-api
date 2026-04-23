import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserProfile,
  createUserProfile,
  updateUserProfile
} from "../controllers/users.controller";
import { validate } from "../middleware/validate";
import { createUserSchema, updateUserSchema } from "../validators/users.validator";

const router = Router();

// user routes
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", validate(createUserSchema), createUser);
router.put("/:id", validate(updateUserSchema), updateUser);
router.delete("/:id", deleteUser);

// profile routes
router.get("/:id/profile", getUserProfile);
router.post("/:id/profile", createUserProfile);
router.put("/:id/profile", updateUserProfile);

export default router;