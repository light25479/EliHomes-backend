// routes/tenantRoutes.js
import express from 'express';
import { verifyToken, isTenant } from '../middleware/auth.js';
import * as tenantController from '../controllers/tenantController.js';

const router = express.Router();

router.get('/my-rent-payments', verifyToken, tenantController.getMyRentPayments);
router.get('/assigned-property', verifyToken, isTenant, tenantController.getAssignedProperty);
router.get('/my-bills', verifyToken, tenantController.getMyBills);
router.post('/pay-rent', verifyToken, tenantController.payRent);
router.put('/update-profile', verifyToken, tenantController.updateProfile);
router.post('/contact-support', verifyToken, tenantController.contactSupport);
router.get('/transactions', verifyToken, isTenant, tenantController.getTransactionHistory);

export default router;
