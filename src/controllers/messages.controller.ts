import { Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

const CONVERSATION_INCLUDE = {
  guest: { select: { id: true, name: true, avatar: true } },
  host:  { select: { id: true, name: true, avatar: true } },
  listing: { select: { id: true, title: true, location: true, photos: { take: 1 } } },
  messages: {
    orderBy: { createdAt: "asc" as const },
    include: { sender: { select: { id: true, name: true, avatar: true } } }
  }
};

// GET /messages  — all conversations for current user
export const getConversations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const conversations = await prisma.userConversation.findMany({
      where: { OR: [{ guestId: userId }, { hostId: userId }] },
      include: {
        guest:   { select: { id: true, name: true, avatar: true } },
        host:    { select: { id: true, name: true, avatar: true } },
        listing: { select: { id: true, title: true, location: true, photos: { take: 1 } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, name: true } } }
        }
      },
      orderBy: { updatedAt: "desc" }
    });
    res.json({ data: conversations });
  } catch (error) {
    next(error);
  }
};

// GET /messages/:id  — single conversation with all messages
export const getConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const conversation = await prisma.userConversation.findFirst({
      where: { id, OR: [{ guestId: userId }, { hostId: userId }] },
      include: CONVERSATION_INCLUDE
    });
    if (!conversation) { res.status(404).json({ message: "Conversation not found" }); return; }
    res.json({ data: conversation });
  } catch (error) {
    next(error);
  }
};

// POST /messages  — start or find existing conversation
export const createConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const senderId = req.userId!;
    const senderRole = req.role!;
    const { recipientId, listingId } = req.body;

    if (!recipientId) { res.status(400).json({ message: "recipientId is required" }); return; }

    // Determine guest/host sides
    let guestId: string, hostId: string;
    if (senderRole === "GUEST") {
      guestId = senderId;
      hostId  = recipientId;
    } else {
      guestId = recipientId;
      hostId  = senderId;
    }

    // Find existing or create new
    let conversation = await prisma.userConversation.findFirst({
      where: { guestId, hostId, listingId: listingId ?? null },
      include: CONVERSATION_INCLUDE
    });

    if (!conversation) {
      conversation = await prisma.userConversation.create({
        data: { guestId, hostId, listingId: listingId ?? null },
        include: CONVERSATION_INCLUDE
      });
    }

    res.status(201).json({ data: conversation });
  } catch (error) {
    next(error);
  }
};

// POST /messages/:id  — send a message in a conversation
export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { content } = req.body;

    if (!content?.trim()) { res.status(400).json({ message: "content is required" }); return; }

    const conversation = await prisma.userConversation.findFirst({
      where: { id, OR: [{ guestId: userId }, { hostId: userId }] }
    });
    if (!conversation) { res.status(404).json({ message: "Conversation not found" }); return; }

    const message = await prisma.userMessage.create({
      data: { content: content.trim(), senderId: userId, conversationId: id },
      include: { sender: { select: { id: true, name: true, avatar: true } } }
    });

    // Update conversation timestamp
    await prisma.userConversation.update({ where: { id }, data: { updatedAt: new Date() } });

    res.status(201).json({ data: message });
  } catch (error) {
    next(error);
  }
};
