// routes/adminRoutes.js
import express from 'express';
import {
  getRentStats,
  getBillStats,
  getMaintenanceStats,
  getUserStats,
  getAdminPaymentDashboard
} from '../controllers/adminController.js';
import {
  verifyToken,
  isAdmin,
  authenticate,
  authorizeAdmin
} from '../middleware/auth.js';

const router = express.Router();

// Admin stats routes
router.get('/rent-stats', verifyToken, isAdmin, getRentStats);
router.get('/bill-stats', verifyToken, isAdmin, getBillStats);
router.get('/maintenance-stats', verifyToken, isAdmin, getMaintenanceStats);
router.get('/user-stats', verifyToken, isAdmin, getUserStats);

// Admin dashboard route
router.get('/dashboard/payments', authenticate, authorizeAdmin, getAdminPaymentDashboard);

export default router;
