// controllers/adminController.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get Rent Statistics
export const getRentStats = async (req, res) => {
  try {
    const { month, year } = req.query;

    let dateFilter = {};
    if (month && year) {
      const start = new Date(`${year}-${month}-01`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      dateFilter.createdAt = {
        gte: start,
        lt: end,
      };
    }

    const totalCollected = await prisma.rentPayment.aggregate({
      _sum: { amountPaid: true },
      where: dateFilter,
    });

    const pendingRents = await prisma.rentPayment.findMany({
      where: {
        isPaid: false,
      },
    });

    res.json({
      totalCollected: totalCollected._sum.amountPaid || 0,
      pendingCount: pendingRents.length,
      pendingAmount: pendingRents.reduce((sum, rent) => sum + rent.amountPaid, 0),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch rent statistics', error });
  }
};

// Get Bill Statistics
export const getBillStats = async (req, res) => {
  try {
    const { month, year } = req.query;

    let dateFilter = {};
    if (month && year) {
      const start = new Date(`${year}-${month}-01`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      dateFilter.dueDate = {
        gte: start,
        lt: end,
      };
    }

    const totalBilled = await prisma.bill.aggregate({
      _sum: { amount: true },
      where: dateFilter,
    });

    const unpaidBills = await prisma.bill.findMany({
      where: {
        isPaid: false,
        ...dateFilter,
      },
    });

    res.json({
      totalBilled: totalBilled._sum.amount || 0,
      unpaidCount: unpaidBills.length,
      unpaidAmount: unpaidBills.reduce((sum, bill) => sum + bill.amount, 0),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch bill statistics', error });
  }
};

// Get Maintenance Statistics
export const getMaintenanceStats = async (req, res) => {
  try {
    const totalRequests = await prisma.maintenanceRequest.count();

    const pendingRequests = await prisma.maintenanceRequest.count({
      where: { status: 'Pending' },
    });

    const resolvedRequests = await prisma.maintenanceRequest.count({
      where: { status: 'Resolved' },
    });

    res.json({
      totalRequests,
      pendingRequests,
      resolvedRequests,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch maintenance statistics', error });
  }
};

// Get User Type Statistics
export const getUserStats = async (req, res) => {
  try {
    const tenants = await prisma.user.count({ where: { role: 'TENANT' } });
    const owners = await prisma.user.count({ where: { role: 'OWNER' } });
    const agents = await prisma.user.count({ where: { role: 'AGENT' } });

    res.json({
      tenants,
      owners,
      agents,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch user statistics', error });
  }
};

// Admin Dashboard Summary
export const getAdminPaymentDashboard = async (req, res) => {
  try {
    const rentStats = await prisma.rentPayment.aggregate({
      _sum: {
        amount: true,
        serviceCharge: true,
        totalAmount: true,
      },
      _count: true,
    });

    const billStats = await prisma.billPayment.aggregate({
      _sum: {
        amount: true,
        serviceCharge: true,
        totalAmount: true,
      },
      _count: true,
    });

    const allMethods = await prisma.rentPayment.groupBy({
      by: ['paymentMethod'],
      _sum: { amount: true }
    });

    res.status(200).json({
      rent: rentStats,
      bills: billStats,
      methodBreakdown: allMethods
    });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};
