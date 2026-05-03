import { Router } from "express";
import {
  aiSearch,
  generateDescription,
  chat,
  recommend,
  reviewSummary
} from "../../controllers/ai.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/v1/ai/search:
 *   post:
 *     summary: Smart listing search using AI
 *     tags: [AI]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 5
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *                 example: apartment in Kigali under $100 for 2 guests
 *     responses:
 *       200:
 *         description: AI extracted filters and matching listings
 *       400:
 *         description: Could not extract filters from query
 */
router.post("/search", aiSearch);

/**
 * @swagger
 * /api/v1/ai/listings/{id}/generate-description:
 *   post:
 *     summary: Generate AI listing description with tone control
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tone:
 *                 type: string
 *                 enum: [professional, casual, luxury]
 *                 example: luxury
 *     responses:
 *       200:
 *         description: Generated description and updated listing
 *       403:
 *         description: You can only generate descriptions for your own listings
 *       404:
 *         description: Listing not found
 */
router.post("/listings/:id/generate-description", authenticate, generateDescription);

/**
 * @swagger
 * /api/v1/ai/chat:
 *   post:
 *     summary: Guest support chatbot with optional listing context
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, message]
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: user-123-session-1
 *               message:
 *                 type: string
 *                 example: Does this place have WiFi?
 *               listingId:
 *                 type: string
 *                 example: 8108f16b-0574-46bd-a533-1ce2edb914fa
 *     responses:
 *       200:
 *         description: AI response with session info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                 sessionId:
 *                   type: string
 *                 messageCount:
 *                   type: integer
 *       400:
 *         description: Missing required fields
 */
router.post("/chat", chat);

/**
 * @swagger
 * /api/v1/ai/recommend:
 *   post:
 *     summary: AI listing recommendations based on booking history
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI recommendations based on booking history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 preferences:
 *                   type: string
 *                 reason:
 *                   type: string
 *                 searchFilters:
 *                   type: object
 *                 recommendations:
 *                   type: array
 *       400:
 *         description: No booking history found
 */
router.post("/recommend", authenticate, recommend);

/**
 * @swagger
 * /api/v1/ai/listings/{id}/review-summary:
 *   get:
 *     summary: AI generated review summary for a listing
 *     tags: [AI]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *     responses:
 *       200:
 *         description: AI generated review summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: string
 *                 positives:
 *                   type: array
 *                   items:
 *                     type: string
 *                 negatives:
 *                   type: array
 *                   items:
 *                     type: string
 *                 averageRating:
 *                   type: number
 *                 totalReviews:
 *                   type: integer
 *       400:
 *         description: Not enough reviews
 *       404:
 *         description: Listing not found
 */
router.get("/listings/:id/review-summary", reviewSummary);

export default router;
