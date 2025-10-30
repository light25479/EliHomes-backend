// routes/supportRoutes.js
import express from 'express';
import { sendSupportMessage, getMyMessages } from '../controllers/supportController.js';
import { verifyToken, isTenant } from '../middleware/auth.js';

const router = express.Router();

router.post('/send', verifyToken, isTenant, sendSupportMessage);
router.get('/my', verifyToken, isTenant, getMyMessages);

export default router;
