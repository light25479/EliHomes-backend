import { PrismaClient } from '@prisma/client';
import { calculateServiceCharge, getDestinationAccount } from '../utils/paymentUtils.js';
import { logAudit } from '../utils/logger.js';
import { sendReceiptEmail } from '../utils/mailer.js';

const prisma = new PrismaClient();

// Create a new bill
export const createBill = async (req, res) => {
  try {
    const { amount, dueDate, tenantId, propertyId } = req.body;
    const bill = await prisma.bill.create({
      data: {
        amount,
        dueDate: new Date(dueDate),
        tenantId,
        propertyId,
      },
    });
    res.status(201).json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create bill', error });
  }
};

// Get all bills
export const getAllBills = async (req, res) => {
  try {
    const bills = await prisma.bill.findMany({
      include: {
        tenant: true,
        property: true,
      },
    });
    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bills', error });
  }
};

// Mark a bill as paid
export const markBillAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await prisma.bill.update({
      where: { id: Number(id) },
      data: { isPaid: true },
    });
    res.status(200).json({ message: 'Bill marked as paid', bill });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update bill', error });
  }
};

// Get unpaid bills
export const getUnpaidBills = async (req, res) => {
  try {
    const tenantId = req.user.id;

    const tenant = await prisma.user.findUnique({
      where: { id: tenantId },
      include: {
        properties: {
          include: {
            bills: {
              include: {
                billPayments: {
                  where: { tenantId }
                }
              }
            }
          }
        }
      }
    });

    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const unpaidBills = [];

    for (const property of tenant.properties) {
      for (const bill of property.bills) {
        const hasPaid = bill.billPayments.length > 0;
        if (!hasPaid) {
          unpaidBills.push({
            billId: bill.id,
            title: bill.title,
            description: bill.description,
            amount: bill.amount,
            dueDate: bill.dueDate,
            property: {
              id: property.id,
              name: property.name,
              location: property.location
            }
          });
        }
      }
    }

    res.status(200).json(unpaidBills);
  } catch (error) {
    console.error('Error fetching unpaid bills:', error);
    res.status(500).json({ error: 'Failed to fetch unpaid bills' });
  }
};

// Get bill summary
export const getBillSummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    let whereClause = {};

    if (month && year) {
      const startDate = new Date(`${year}-${month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      whereClause.dueDate = {
        gte: startDate,
        lt: endDate,
      };
    }

    const totalBills = await prisma.bill.aggregate({
      _sum: {
        amount: true,
      },
      where: whereClause,
    });

    res.status(200).json({
      period: month && year ? `${month}-${year}` : "All time",
      totalBills: totalBills._sum.amount || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bill summary', error });
  }
};

// Get tenant bills
export const getMyBills = async (req, res) => {
  try {
    const tenantId = req.user.id;
    const bills = await prisma.bill.findMany({
      where: { tenantId },
      orderBy: { dueDate: 'desc' },
      include: { property: true },
    });
    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve tenant bills', error });
  }
};

// Get paid bills
export const getPaidBills = async (req, res) => {
  try {
    const tenantId = req.user.id;
    const billPayments = await prisma.billPayment.findMany({
      where: { tenantId },
      include: {
        bill: { include: { property: true } }
      },
      orderBy: { paidAt: 'desc' }
    });

    const maskAccount = (account) => {
      if (!account || account.length < 6) return '****';
      return account.slice(0, 2) + '*'.repeat(account.length - 4) + account.slice(-2);
    };

    const paidBills = billPayments.map(payment => ({
      billId: payment.billId,
      amountPaid: payment.amount,
      paymentMethod: payment.paymentMethod,
      paidAt: payment.paidAt,
      destinationAccount: maskAccount(payment.destinationAccount),
      serviceCharge: payment.serviceCharge,
      serviceChargeAccount: maskAccount(payment.serviceChargeAccount),
      bill: {
        title: payment.bill.title,
        description: payment.bill.description,
        dueDate: payment.bill.dueDate,
        property: {
          id: payment.bill.property.id,
          name: payment.bill.property.name,
          location: payment.bill.property.location
        }
      }
    }));

    res.status(200).json(paidBills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch paid bills' });
  }
};

// Pay bill
export const payBill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { billId, amount, paymentMethod } = req.body;

    const bill = await prisma.bill.findUnique({ where: { id: billId } });
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    const serviceCharge = calculateServiceCharge(amount, paymentMethod);
    const totalAmount = amount + serviceCharge;

    const payment = await prisma.billPayment.create({
      data: {
        tenantId: userId,
        billId,
        propertyId: bill.propertyId,
        amount,
        serviceCharge,
        totalAmount,
        paymentMethod,
        status: 'paid',
        paidAt: new Date(),
        destinationAccount: await getDestinationAccount(bill.agentId || bill.ownerId),
        serviceChargeAccount: process.env.SERVICE_ACCOUNT_NUMBER,
      },
    });

    const tenant = await prisma.user.findUnique({ where: { id: userId } });
    const property = await prisma.property.findUnique({ where: { id: bill.propertyId } });

    await sendReceiptEmail(
      tenant.email,
      'Rent Payment Receipt - EliHomes',
      `
        <h3>Payment Receipt</h3>
        <p>Hi ${tenant.name},</p>
        <p>Thank you for your payment of <strong>KES ${totalAmount}</strong> via ${paymentMethod}.</p>
        <p><strong>Service Charge:</strong> KES ${serviceCharge}</p>
        <p><strong>Paid On:</strong> ${new Date().toLocaleString()}</p>
        <p>Property: ${property.name}</p>
        <br>
        <p>Regards,<br>EliHomes</p>
      `
    );

    await logAudit({
      userId,
      action: 'PAY_BILL',
      details: `Paid bill of ${amount} for bill #${billId} via ${paymentMethod}`,
    });

    res.status(200).json({ message: 'Bill paid successfully', payment });
  } catch (error) {
    res.status(500).json({ message: 'Bill payment failed', error });
  }
};
