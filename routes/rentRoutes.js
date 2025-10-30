// routes/rentRoutes.js
import express from 'express';
import {
  createRentPayment,
  getAllRents,
  getRentById,
  updateRentStatus,
  deleteRent,
  // getRentSummary // Uncomment if/when implemented
} from '../controllers/rentController.js';

import { verifyToken, isAgent } from '../middleware/auth.js';

const router = express.Router();

// Agent-only routes
router.post('/', verifyToken, isAgent, createRentPayment);
router.get('/', verifyToken, isAgent, getAllRents);
// router.get('/summary', verifyToken, isAgent, getRentSummary); // Uncomment if implemented
router.get('/:id', verifyToken, isAgent, getRentById);
router.put('/:id', verifyToken, isAgent, updateRentStatus);
router.delete('/:id', verifyToken, isAgent, deleteRent);

export default router;

