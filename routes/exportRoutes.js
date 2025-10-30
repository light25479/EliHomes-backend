// server/routes/exportRoutes.js
import express from 'express';
import { exportRentPayments, exportBillPayments } from '../controllers/exportController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/rent', authenticate, authorizeAdmin, exportRentPayments);
router.get('/bills', authenticate, authorizeAdmin, exportBillPayments);

export default router;

