// server/routes/billRoutes.js
import express from 'express';
import {
  createBill,
  getAllBills,
  markBillAsPaid,
  getUnpaidBills,
  getBillSummary,
  getMyBills,
  payBill,
  getPaidBills
} from '../controllers/billController.js';
import { verifyToken, isTenant } from '../middleware/auth.js';

const router = express.Router();

// Bill routes
router.post('/', verifyToken, createBill);
router.get('/', verifyToken, getAllBills);
router.put('/:id/pay', verifyToken, markBillAsPaid);
router.get('/summary', verifyToken, getBillSummary);
router.get('/my', verifyToken, isTenant, getMyBills);
router.get('/paid', verifyToken, isTenant, getPaidBills);
router.get('/unpaid', verifyToken, isTenant, getUnpaidBills);
router.post('/pay/:id', verifyToken, isTenant, payBill);

export default router;





