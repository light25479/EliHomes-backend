// routes/payoutRoutes.js
import express from 'express';
import {
  setPayoutAccount,
  getPayoutAccounts
} from '../controllers/payoutAccountController.js';

const router = express.Router();

// Set or update payout account
router.post('/', setPayoutAccount);

// Get all payout accounts for an owner
router.get('/:ownerId', getPayoutAccounts);

export default router;

