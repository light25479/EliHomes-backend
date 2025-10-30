// server/routes/maintenanceRoutes.js
import express from 'express';
import {
  createRequest,
  getMyRequests,
  getAllRequests,
  updateStatus
} from '../controllers/maintenanceController.js';
import { verifyToken, isAgent, isTenant } from '../middleware/auth.js';

const router = express.Router();

// Tenant submits a request
router.post('/create', verifyToken, isTenant, createRequest);

// Tenant gets their own requests
router.get('/my', verifyToken, isTenant, getMyRequests);

// Agent/admin gets all requests
router.get('/', verifyToken, isAgent, getAllRequests);

// Agent/admin updates status
router.put('/:id/status', verifyToken, isAgent, updateStatus);

export default router;
