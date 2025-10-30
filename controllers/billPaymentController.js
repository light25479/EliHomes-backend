// controllers/billPaymentController.js (ESM version)
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { sendEmail } from '../utils/emailService.js';

config();
const prisma = new PrismaClient();

// Create a bill payment
export const createBillPayment = async (req, res) => {
  try {
    const { billId, propertyId, amount, paymentMethod } = req.body;
    const tenantId = req.user.id;

    let serviceChargeRate = 0;
    switch (paymentMethod.toLowerCase()) {
      case 'mpesa':
        serviceChargeRate = 0.015;
        break;
      case 'bank':
        serviceChargeRate = 0.025;
        break;
      case 'card':
        serviceChargeRate = 0.03;
        break;
      default:
        return res.status(400).json({ error: 'Invalid payment method' });
    }

    const serviceCharge = parseFloat((amount * serviceChargeRate).toFixed(2));
    const totalAmount = parseFloat((amount + serviceCharge).toFixed(2));

    const systemAccount = process.env.SYSTEM_ACCOUNT || 'System-EliHomes-VirtualWallet';
    let payoutAccount;
    switch (paymentMethod.toLowerCase()) {
      case 'mpesa':
        payoutAccount = process.env.MPESA_PAYBILL || '601234';
        break;
      case 'bank':
        payoutAccount = process.env.BANK_ACCOUNT_NO || '0123456789';
        break;
      case 'card':
        payoutAccount = process.env.CARD_GATEWAY || 'Stripe';
        break;
    }

    const billPayment = await prisma.billPayment.create({
      data: {
        billId,
        tenantId,
        propertyId,
        amount,
        serviceCharge,
        totalAmount,
        paymentMethod,
        destinationAccount: payoutAccount,
        serviceChargeAccount: systemAccount,
        paidAt: new Date(),
        status: 'completed'
      }
    });

    res.status(201).json({ message: 'Bill payment recorded', billPayment });
  } catch (error) {
    console.error('Error creating bill payment:', error);
    res.status(500).json({ error: 'Failed to record bill payment' });
  }
};

// Get all bill payments
export const getBillPayments = async (req, res) => {
  try {
    const payments = await prisma.billPayment.findMany({
      include: {
        bill: true,
        tenant: true,
      },
    });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payments", error });
  }
};

// Alternate payBill function
export const payBill = async (req, res) => {
  try {
    const { tenantId, billId, amount, paymentMethod } = req.body;

    const mpesaAccount = process.env.MPESA_ACCOUNT;
    const bankAccount = process.env.BANK_ACCOUNT;
    const cardAccount = process.env.CARD_ACCOUNT;
    const serviceAccount = process.env.SERVICE_ACCOUNT;

    let destinationAccount;
    let serviceCharge = 0;

    if (paymentMethod === 'mpesa') {
      serviceCharge = 0.02 * amount;
      destinationAccount = mpesaAccount;
    } else if (paymentMethod === 'bank') {
      serviceCharge = 0.015 * amount;
      destinationAccount = bankAccount;
    } else if (paymentMethod === 'card') {
      serviceCharge = 0.025 * amount;
      destinationAccount = cardAccount;
    } else {
      return res.status(400).json({ message: 'Unsupported payment method' });
    }

    const totalAmount = amount + serviceCharge;

    const billPayment = await prisma.billPayment.create({
      data: {
        tenantId,
        billId,
        amount,
        serviceCharge,
        totalAmount,
        paymentMethod,
        destinationAccount,
        serviceChargeAccount: serviceAccount,
        status: 'pending',
      },
    });

    // Optional notification (replace dummy data)
    await sendEmail({
      to: 'elijahmuchui96@gmail.com',
      subject: 'New Payment Received',
      html: `
        <h3>New Payment Received</h3>
        <p><strong>Tenant:</strong> ${tenantId}</p>
        <p><strong>Amount:</strong> ${amount}</p>
        <p><strong>Method:</strong> ${paymentMethod}</p>
        <p><strong>Property:</strong> ${billId}</p>
        <p><strong>Paid At:</strong> ${new Date().toLocaleString()}</p>
      `,
    });

    res.status(201).json({ message: 'Bill payment recorded', billPayment });
  } catch (error) {
    console.error('Bill payment error:', error);
    res.status(500).json({ message: 'Failed to make bill payment', error });
  }
};
