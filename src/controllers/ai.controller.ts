import { Request, Response, NextFunction } from "express";
import Groq from "groq-sdk";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

const groq = new Groq({ apiKey: process.env["GROQ_API_KEY"] });

const getStringParam = (value: string | string[] | undefined): string | undefined => {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

const chat_sessions = new Map<string, { role: "user" | "assistant"; content: string }[]>();

// POST /api/v1/ai/search
export const aiSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.body;
    if (!query) { res.status(400).json({ message: "query is required" }); return; }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const skip = (page - 1) * limit;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Extract search filters from the user query and return ONLY valid JSON with these optional fields:
          { "location": string, "minPrice": number, "maxPrice": number, "guests": number, "type": string }
          Do not include any explanation, only JSON.`
        },
        { role: "user", content: query }
      ]
    });

    let filters: any = {};
    try {
      const text = completion.choices[0]?.message?.content ?? "{}";
      filters = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
    } catch {
      res.status(400).json({ message: "Could not extract filters from query" }); return;
    }

    const where: any = {};
    if (filters.location) where.location = { contains: filters.location, mode: "insensitive" };
    if (filters.type) where.type = filters.type.toUpperCase();
    if (filters.minPrice || filters.maxPrice) {
      where.pricePerNight = {};
      if (filters.minPrice) where.pricePerNight.gte = filters.minPrice;
      if (filters.maxPrice) where.pricePerNight.lte = filters.maxPrice;
    }
    if (filters.guests) where.guests = { gte: filters.guests };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: { host: { select: { id: true, name: true, avatar: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.listing.count({ where })
    ]);

    res.json({
      filters,
      data: listings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/ai/listings/:id/generate-description
export const generateDescription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = getStringParam(req.params.id);
    const tone = req.body.tone ?? "professional";
    if (!id) { res.status(400).json({ message: "Listing id is required" }); return; }

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) { res.status(404).json({ message: "Listing not found" }); return; }
    if (listing.hostId !== req.userId && req.role !== "ADMIN") {
      res.status(403).json({ message: "You can only generate descriptions for your own listings" }); return;
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a real estate copywriter. Write a compelling ${tone} listing description in 2-3 sentences.`
        },
        {
          role: "user",
          content: `Listing: ${listing.title}, Location: ${listing.location}, Type: ${listing.type}, Price: $${listing.pricePerNight}/night, Guests: ${listing.guests}`
        }
      ]
    });

    const description = completion.choices[0]?.message?.content ?? "";
    const updated = await prisma.listing.update({ where: { id }, data: { description } });

    res.json({ description, listing: updated });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/ai/chat
export const chat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, message, listingId } = req.body;
    if (!sessionId || !message) { res.status(400).json({ message: "sessionId and message are required" }); return; }

    const history = chat_sessions.get(sessionId) ?? [];

    let systemContext = "You are a helpful Airbnb guest support assistant.";
    const listingIdValue = getStringParam(listingId);
    if (listingIdValue) {
      const listing = await prisma.listing.findUnique({ where: { id: listingIdValue } });
      if (listing) {
        systemContext += ` The guest is asking about: ${listing.title} in ${listing.location}. Price: $${listing.pricePerNight}/night. ${listing.description ?? ""}`;
      }
    }

    history.push({ role: "user", content: message });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemContext }, ...history]
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    history.push({ role: "assistant", content: reply });
    chat_sessions.set(sessionId, history);

    res.json({ response: reply, sessionId, messageCount: history.length });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/ai/recommend
export const recommend = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const bookings = await prisma.booking.findMany({
      where: { guestId: userId },
      include: { listing: true },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    if (!bookings.length) { res.status(400).json({ message: "No booking history found" }); return; }

    const history = bookings.map(b =>
      `${b.listing.title} in ${b.listing.location} ($${b.listing.pricePerNight}/night, type: ${b.listing.type})`
    ).join("; ");

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Based on booking history, return ONLY valid JSON: { "preferences": string, "reason": string, "searchFilters": { "location"?: string, "type"?: string, "maxPrice"?: number } }`
        },
        { role: "user", content: `Booking history: ${history}` }
      ]
    });

    let aiResult: any = {};
    try {
      const text = completion.choices[0]?.message?.content ?? "{}";
      aiResult = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
    } catch {
      aiResult = { preferences: "varied", reason: "Based on your history", searchFilters: {} };
    }

    const where: any = {};
    if (aiResult.searchFilters?.location) where.location = { contains: aiResult.searchFilters.location, mode: "insensitive" };
    if (aiResult.searchFilters?.type) where.type = aiResult.searchFilters.type.toUpperCase();
    if (aiResult.searchFilters?.maxPrice) where.pricePerNight = { lte: aiResult.searchFilters.maxPrice };

    const recommendations = await prisma.listing.findMany({
      where,
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { host: { select: { id: true, name: true, avatar: true } } }
    });

    res.json({ ...aiResult, recommendations });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/ai/listings/:id/review-summary
export const reviewSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getStringParam(req.params.id);
    if (!id) { res.status(400).json({ message: "Listing id is required" }); return; }

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) { res.status(404).json({ message: "Listing not found" }); return; }

    const reviews = await prisma.review.findMany({
      where: { listingId: id },
      select: { rating: true, comment: true }
    });

    if (reviews.length < 3) { res.status(400).json({ message: "Not enough reviews to summarize" }); return; }

    const reviewText = reviews.map(r => `Rating: ${r.rating}/5 - ${r.comment}`).join("\n");
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Summarize reviews and return ONLY valid JSON: { "summary": string, "positives": string[], "negatives": string[] }`
        },
        { role: "user", content: reviewText }
      ]
    });

    let aiResult: any = { summary: "", positives: [], negatives: [] };
    try {
      const text = completion.choices[0]?.message?.content ?? "{}";
      aiResult = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
    } catch { /* use defaults */ }

    res.json({ ...aiResult, averageRating: Math.round(averageRating * 10) / 10, totalReviews: reviews.length });
  } catch (error) {
    next(error);
  }
};
