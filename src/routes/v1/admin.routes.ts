import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import {
  getAdminStats,
  getAdminUsers,
  updateUserStatus,
  deleteAdminUser,
  getAdminListings,
  updateListingStatus,
  getAdminBookings,
  updateAdminBookingStatus,
  getAdminReviews,
  updateReviewStatus,
  deleteAdminReview,
  getAdminPayments
} from '../../controllers/admin.controller';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteAdminUser);
router.get('/listings', getAdminListings);
router.patch('/listings/:id/status', updateListingStatus);
router.get('/bookings', getAdminBookings);
router.patch('/bookings/:id/status', updateAdminBookingStatus);
router.get('/reviews', getAdminReviews);
router.patch('/reviews/:id/status', updateReviewStatus);
router.delete('/reviews/:id', deleteAdminReview);
router.get('/payments', getAdminPayments);

export default router;
