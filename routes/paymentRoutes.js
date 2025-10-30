import express from 'express';
import {
  setPaymentDetails,
  getMyPaymentDetails,
  getPaymentDetailsByUser,
  makeRentPayment,
  payToListProperty, // ✅ NEW controller for property listing payment
} from '../controllers/paymentController.js';

import authMiddleware, {
  isAgentOrAdmin,
} from '../middleware/auth.js';

const router = express.Router();

// ✅ General payment details management
router.post('/details', authMiddleware, setPaymentDetails);
router.get('/details', authMiddleware, getMyPaymentDetails);
router.get('/details/:userId', authMiddleware, isAgentOrAdmin, getPaymentDetailsByUser);

// ✅ Rent payments
router.post('/rent', authMiddleware, makeRentPayment);

// ✅ NEW: Pay Ksh. 200 to list a new property
router.post('/list-property', authMiddleware, payToListProperty);

export default router;
