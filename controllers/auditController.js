import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Admin: View audit logs with optional filters
export const getAuditLogs = async (req, res) => {
  try {
    const { userId, action, from, to } = req.query;

    const filters = {};
    if (userId) filters.userId = parseInt(userId);
    if (action) filters.action = { contains: action };
    if (from || to) {
      filters.timestamp = {};
      if (from) filters.timestamp.gte = new Date(from);
      if (to) filters.timestamp.lte = new Date(to);
    }

    const logs = await prisma.auditLog.findMany({
      where: filters,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch audit logs', error });
  }
};
