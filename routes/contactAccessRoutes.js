import express from 'express';
import {
  checkContactAccess,
  grantContactAccess,
} from '../controllers/contactAccessController.js';

import authMiddleware from '../middleware/auth.js';
import { checkPayment } from '../middleware/paymentCheck.js'; // ✅ Correct middleware import

const router = express.Router();

// ✅ Public route: check if the user already has access
router.get('/check', authMiddleware, checkContactAccess);

// ✅ Protected route: grant access to contact info
// 💡 During testing, you can skip checkPayment like this:
// router.post('/grant', authMiddleware, grantContactAccess);
router.post('/grant', authMiddleware, checkPayment('CONTACT_ACCESS'), grantContactAccess);

export default router;
