// routes/auditRoutes.js
import express from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Only admins can access audit logs
router.get('/', authenticateUser, authorizeRoles('admin'), getAuditLogs);

export default router;
