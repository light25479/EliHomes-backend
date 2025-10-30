// routes/transactionRoutes.js
import express from 'express';
import * as transactionController from '../controllers/transactionController.js';
import { protect, adminOrAgentOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/filter', protect, adminOrAgentOnly, transactionController.getFilteredTransactions);

export default router;

