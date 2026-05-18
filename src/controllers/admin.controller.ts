import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /admin/stats
export const getAdminStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalUsers,
      totalHosts,
      totalListings,
      totalBookings,
      totalReviews,
      revenueResult,
      recentBookings,
      recentUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'HOST' } }),
      prisma.listing.count(),
      prisma.booking.count(),
      prisma.review.count(),
      prisma.booking.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { totalPrice: true }
      }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          guest: { select: { name: true, avatar: true } },
          listing: { select: { title: true } }
        }
      }),
      prisma.user.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, role: true, createdAt: true, status: true,
          _count: { select: { bookings: true } }
        }
      })
    ]);

    res.json({
      data: {
        totalUsers,
        totalHosts,
        totalListings,
        totalBookings,
        totalReviews,
        totalRevenue: revenueResult._sum.totalPrice ?? 0,
        recentBookings,
        recentUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /admin/users
export const getAdminUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
        status: true,
        _count: { select: { listings: true, bookings: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: users });
  } catch (error) {
    next(error);
  }
};

// PATCH /admin/users/:id/status
export const updateUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      res.status(400).json({ message: 'Invalid status. Must be ACTIVE or SUSPENDED' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true }
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /admin/users/:id
export const deleteAdminUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /admin/listings
export const getAdminListings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const listings = await prisma.listing.findMany({
      include: {
        host: { select: { id: true, name: true, email: true, avatar: true } },
        photos: { take: 1 },
        _count: { select: { bookings: true, reviews: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: listings });
  } catch (error) {
    next(error);
  }
};

// PATCH /admin/listings/:id/status
export const updateListingStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ message: 'Invalid status. Must be PENDING, APPROVED, or REJECTED' });
      return;
    }

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      res.status(404).json({ message: 'Listing not found' });
      return;
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: { status }
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
};

// GET /admin/bookings
export const getAdminBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        guest: { select: { id: true, name: true, email: true, avatar: true } },
        listing: {
          select: {
            id: true,
            title: true,
            location: true,
            pricePerNight: true,
            photos: { take: 1 }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: bookings });
  } catch (error) {
    next(error);
  }
};

// PATCH /admin/bookings/:id/status
export const updateAdminBookingStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
      res.status(400).json({ message: 'Invalid status. Must be PENDING, CONFIRMED, or CANCELLED' });
      return;
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status }
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
};

// GET /admin/reviews
export const getAdminReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        listing: { select: { id: true, title: true, location: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: reviews });
  } catch (error) {
    next(error);
  }
};

// PATCH /admin/reviews/:id/status
export const updateReviewStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'].includes(status)) {
      res.status(400).json({ message: 'Invalid status. Must be PENDING, APPROVED, REJECTED, or FLAGGED' });
      return;
    }

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { status }
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /admin/reviews/:id
export const deleteAdminReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    await prisma.review.delete({ where: { id } });
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /admin/payments
export const getAdminPayments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'CANCELLED', 'PENDING'] } },
      include: {
        guest: { select: { id: true, name: true, email: true } },
        listing: { select: { id: true, title: true, location: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: bookings });
  } catch (error) {
    next(error);
  }
};
