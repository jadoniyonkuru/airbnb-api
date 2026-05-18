import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { getCache, setCache } from "../config/cache";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

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

// GET /analytics  — chart data for admin dashboard
export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = "analytics:dashboard";
    const cached = getCache(cacheKey);
    if (cached) { res.json(cached); return; }

    const now = new Date();
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);

    const [allBookings, allUsers] = await Promise.all([
      prisma.booking.findMany({
        where: { createdAt: { gte: yearAgo }, status: { not: "CANCELLED" } },
        select: { totalPrice: true, createdAt: true }
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: yearAgo } },
        select: { createdAt: true }
      })
    ]);

    // Monthly revenue & bookings (last 12 months)
    const revenueMap = new Map<string, { revenue: number; bookings: number }>();
    const userMap = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      revenueMap.set(key, { revenue: 0, bookings: 0 });
      userMap.set(key, 0);
    }
    allBookings.forEach(b => {
      const d = new Date(b.createdAt);
      const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      if (revenueMap.has(key)) {
        const cur = revenueMap.get(key)!;
        cur.revenue += b.totalPrice;
        cur.bookings += 1;
      }
    });
    allUsers.forEach(u => {
      const d = new Date(u.createdAt);
      const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      if (userMap.has(key)) userMap.set(key, userMap.get(key)! + 1);
    });

    const monthlyRevenue = Array.from(revenueMap.entries()).map(([k, v]) => ({
      month: k.split(" ")[0],
      revenue: Math.round(v.revenue),
      bookings: v.bookings
    }));
    const userGrowth = Array.from(userMap.entries()).map(([k, v]) => ({
      month: k.split(" ")[0],
      users: v
    }));

    // Weekly booking pattern (all time)
    const weeklyBuckets = DAYS.map(d => ({ day: d, bookings: 0 }));
    allBookings.forEach(b => {
      const dow = new Date(b.createdAt).getDay();
      weeklyBuckets[dow].bookings += 1;
    });

    const result = {
      data: {
        monthlyRevenue,
        userGrowth,
        weeklyBookings: weeklyBuckets
      }
    };
    setCache(cacheKey, result, 300);
    res.json(result);
  } catch (error) {
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