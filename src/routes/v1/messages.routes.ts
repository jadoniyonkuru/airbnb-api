import { Router } from "express";
import {
  getConversations,
  getConversation,
  createConversation,
  sendMessage
} from "../../controllers/messages.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.get("/",     authenticate, getConversations);
router.get("/:id",  authenticate, getConversation);
router.post("/",    authenticate, createConversation);
router.post("/:id", authenticate, sendMessage);

export default router;
