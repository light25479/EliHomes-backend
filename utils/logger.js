// utils/logger.js
export const logAudit = async ({ userId, action, details }) => {
  console.log(`[AUDIT] User: ${userId}, Action: ${action}, Details: ${details}`);
};
