// utils/auditLogger.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Logs a user action to the AuditLog table.
 * @param {Object} params
 * @param {number} params.userId - ID of the user performing the action
 * @param {string} params.action - Short action name (e.g. "CREATE_PROPERTY")
 * @param {string} [params.details] - Optional message or JSON description
 */
export const logAudit = async ({ userId, action, details }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
      },
    });
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
};
