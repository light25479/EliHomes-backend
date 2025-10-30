// server/routes/billPaymentRoutes.js
import express from 'express';
import {
  createBillPayment,
  getBillPayments,
  payBill,
} from '../controllers/billPaymentController.js';
import { verifyToken, isTenant } from '../middleware/auth.js';

const router = express.Router();

// ✅ Tenant creates a bill payment
router.post('/', verifyToken, isTenant, createBillPayment);

// ✅ Get bill payments (accessible to authenticated users)
router.get('/', verifyToken, getBillPayments);

// ✅ Pay a bill
router.post('/pay', verifyToken, isTenant, payBill);

export default router;
