import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getFilteredTransactions = async (req, res) => {
  try {
    const { startDate, endDate, status, method, tenant, property } = req.query;

    const rentFilters = {
      ...(startDate && endDate && {
        paidAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
      ...(status && { status }),
      ...(method && { paymentMethod: method }),
      ...(tenant && {
        tenant: {
          OR: [
            { name: { contains: tenant, mode: 'insensitive' } },
            { id: parseInt(tenant) || 0 },
          ],
        },
      }),
      ...(property && {
        property: {
          name: { contains: property, mode: 'insensitive' },
        },
      }),
    };

    const billFilters = {
      ...(startDate && endDate && {
        paidAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
      ...(status && { status }),
      ...(method && { paymentMethod: method }),
      ...(tenant && {
        tenant: {
          OR: [
            { name: { contains: tenant, mode: 'insensitive' } },
            { id: parseInt(tenant) || 0 },
          ],
        },
      }),
      ...(property && {
        property: {
          name: { contains: property, mode: 'insensitive' },
        },
      }),
    };

    const [rentPayments, billPayments] = await Promise.all([
      prisma.rentPayment.findMany({
        where: rentFilters,
        include: { tenant: true, property: true },
        orderBy: { paidAt: 'desc' },
      }),
      prisma.billPayment.findMany({
        where: billFilters,
        include: { tenant: true, property: true },
        orderBy: { paidAt: 'desc' },
      }),
    ]);

    res.status(200).json({ rentPayments, billPayments });
  } catch (error) {
    console.error('Filter Error:', error);
    res.status(500).json({ message: 'Failed to filter transactions' });
  }
};
