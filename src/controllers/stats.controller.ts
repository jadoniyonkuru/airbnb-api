import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { getCache, setCache } from "../config/cache";

// GET /listings/stats
export const getListingsStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // check cache first
    const cacheKey = "stats:listings";
    const cached = getCache(cacheKey);
    if (cached) {
      console.log("Returning cached listings stats");
      res.json(cached);
      return;
    }

    // Promise.all — all 4 queries run at the same time
    const [totalListings, avgPrice, byLocation, byType] = await Promise.all([
      prisma.listing.count(),
      prisma.listing.aggregate({
        _avg: { pricePerNight: true }
      }),
      prisma.listing.groupBy({
        by: ["location"],
        _count: { location: true },
        orderBy: { _count: { location: "desc" } }
      }),
      prisma.listing.groupBy({
        by: ["type"],
        _count: { type: true },
        orderBy: { _count: { type: "desc" } }
      })
    ]);

    const result = {
      totalListings,
      averagePrice: avgPrice._avg.pricePerNight ?? 0,
      byLocation,
      byType
    };

    // cache for 5 minutes
    setCache(cacheKey, result, 300);

    res.json(result);
  } catch (error) {
    console.error("Stats error:", error);
    next(error);
  }
};

// GET /users/stats
export const getUsersStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = "stats:users";
    const cached = getCache(cacheKey);
    if (cached) {
      console.log("Returning cached users stats");
      res.json(cached);
      return;
    }

    // Promise.all — both queries run at the same time
    const [totalUsers, byRole] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ["role"],
        _count: { role: true }
      })
    ]);

    const result = { totalUsers, byRole };

    // cache for 5 minutes
    setCache(cacheKey, result, 300);

    res.json(result);
  } catch (error) {
    console.error("Users stats error:", error);
    next(error);
  }
};