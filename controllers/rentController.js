// rentPaymentController.mjs (Converted to ESM)
import { PrismaClient } from '@prisma/client';
import { calculateServiceCharge, getDestinationAccount } from '../utils/paymentUtils.js';
import { maskAccountNumber } from '../utils/maskUtils.js';
import { logAudit } from '../utils/auditLogger.js';
import { sendReceiptEmail } from '../utils/emailSender.js';
import { sendEmail } from '../utils/emailService.js';

const prisma = new PrismaClient();

export const addRentPayment = async (req, res) => {
  try {
    const { tenantId, propertyId, amount, date } = req.body;

    const payment = await prisma.rentPayment.create({
      data: {
        tenantId,
        propertyId,
        amount,
        date: new Date(date),
        isPaid: true
      },
    });

    res.status(201).json({ message: 'Rent payment recorded', payment });
  } catch (error) {
    console.error('Error adding rent payment:', error);
    res.status(500).json({ error: 'Failed to add rent payment' });
  }
};

export const payRent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId, amount, paymentMethod } = req.body;

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    const agentId = property.agentId || null;

    const serviceCharge = calculateServiceCharge(amount, paymentMethod);
    const totalAmount = amount + serviceCharge;

    const destinationAccount = await getDestinationAccount(agentId || property.ownerId);
    const serviceChargeAccount = process.env.SERVICE_ACCOUNT_NUMBER;

    const payment = await prisma.rentPayment.create({
      data: {
        tenantId: userId,
        propertyId,
        agentId,
        amount,
        serviceCharge,
        totalAmount,
        paymentMethod,
        status: 'paid',
        paidAt: new Date(),
        destinationAccount,
        serviceChargeAccount
      },
    });

    await logAudit({
      userId,
      action: 'PAY_RENT',
      details: `Paid rent of ${amount} for property #${propertyId} via ${paymentMethod}`,
    });

    const maskedPayment = {
      ...payment,
      destinationAccount: maskAccountNumber(destinationAccount),
      serviceChargeAccount: maskAccountNumber(serviceChargeAccount)
    };

    res.status(200).json({ message: 'Rent paid successfully', payment: maskedPayment });
  } catch (error) {
    console.error('Rent payment failed:', error);
    res.status(500).json({ message: 'Rent payment failed', error });
  }
};

export const createRentPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, propertyId, agentId } = req.body;
    const tenantId = req.user.id;

    let serviceChargeRate;
    switch (paymentMethod.toLowerCase()) {
      case 'mpesa': serviceChargeRate = 0.03; break;
      case 'bank': serviceChargeRate = 0.015; break;
      case 'card': serviceChargeRate = 0.05; break;
      default:
        return res.status(400).json({ error: 'Invalid payment method' });
    }

    const serviceCharge = parseFloat((amount * serviceChargeRate).toFixed(2));
    const totalAmount = parseFloat((amount + serviceCharge).toFixed(2));
    const systemAccount = process.env.SYSTEM_ACCOUNT || 'System-EliHomes-VirtualWallet';

    let payoutAccount;
    switch (paymentMethod.toLowerCase()) {
      case 'mpesa': payoutAccount = process.env.MPESA_PAYBILL || '601234'; break;
      case 'bank': payoutAccount = process.env.BANK_ACCOUNT_NO || '0123456789'; break;
      case 'card': payoutAccount = process.env.CARD_GATEWAY || 'Stripe'; break;
    }

    const rentPayment = await prisma.rentPayment.create({
      data: {
        amount,
        serviceCharge,
        totalAmount,
        paymentMethod,
        tenantId,
        agentId,
        propertyId,
        status: 'pending',
        destinationAccount: payoutAccount,
        serviceChargeAccount: systemAccount
      }
    });

    const maskedPayment = {
      ...rentPayment,
      destinationAccount: maskAccountNumber(payoutAccount),
      serviceChargeAccount: maskAccountNumber(systemAccount)
    };

    res.status(201).json({ message: 'Rent payment recorded successfully', rentPayment: maskedPayment });

  } catch (error) {
    console.error('Error creating rent payment:', error);
    res.status(500).json({ error: 'Failed to record rent payment' });
  }
};

export const getRentSummary = async (req, res) => {
  try {
    const total = await prisma.rentPayment.aggregate({
      _sum: {
        amount: true,
        serviceCharge: true,
        totalAmount: true
      }
    });

    res.status(200).json({ summary: total._sum });
  } catch (error) {
    console.error("Error fetching rent summary:", error);
    res.status(500).json({ error: "Failed to get rent summary" });
  }
};

export const getAllRents = async (req, res) => {
  res.status(200).json({ message: "Fetched all rents (dummy response)" });
};

export const getRentById = async (req, res) => {
  res.status(200).json({ message: `Fetched rent by ID: ${req.params.id}` });
};

export const updateRentStatus = async (req, res) => {
  res.status(200).json({ message: `Updated rent status for ID: ${req.params.id}` });
};

export const deleteRent = async (req, res) => {
  res.status(200).json({ message: `Deleted rent with ID: ${req.params.id}` });
};
