import { PrismaClient } from '@prisma/client';
import { maskAccountNumber } from '../utils/maskUtils.js';
import { sendEmail } from '../utils/emailService.js';
import { initiateStkPush } from '../utils/mpesaService.js';

const prisma = new PrismaClient();

// Set or update payment details
export const setPaymentDetails = async (req, res) => {
  try {
    const { method, accountName, accountNumber } = req.body;
    const userId = req.user.id;

    const existing = await prisma.paymentDetails.findFirst({ where: { userId } });

    let paymentDetails;
    if (existing) {
      paymentDetails = await prisma.paymentDetails.update({
        where: { id: existing.id },
        data: { method, accountName, accountNumber },
      });
    } else {
      paymentDetails = await prisma.paymentDetails.create({
        data: {
          userId,
          method,
          accountName,
          accountNumber,
        },
      });
    }

    res.status(200).json(paymentDetails);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save payment details', error });
  }
};

// Get your own masked payment details
export const getMyPaymentDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const paymentDetails = await prisma.paymentDetails.findMany({ where: { userId } });

    const maskedDetails = paymentDetails.map(detail => ({
      ...detail,
      accountNumber: maskAccountNumber(detail.accountNumber),
    }));

    res.status(200).json(maskedDetails);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payment details', error });
  }
};

// Admin/agent: get payment details of specific user
export const getPaymentDetailsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const paymentDetails = await prisma.paymentDetails.findMany({
      where: { userId: parseInt(userId) },
    });

    const maskedDetails = paymentDetails.map(detail => ({
      ...detail,
      accountNumber: maskAccountNumber(detail.accountNumber),
    }));

    res.status(200).json(maskedDetails);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payment details', error });
  }
};

// Make rent payment
export const makeRentPayment = async (req, res) => {
  try {
    const { tenantId, propertyId, amount, paymentMethod } = req.body;

    const mpesaAccount = process.env.MPESA_SHORTCODE;
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

    let rentPayment = await prisma.rentPayment.create({
      data: {
        tenantId,
        propertyId,
        amount,
        serviceCharge,
        totalAmount,
        paymentMethod,
        destinationAccount,
        serviceChargeAccount: serviceAccount,
        status: 'pending',
      },
      include: {
        tenant: true,
        property: true,
      },
    });

    await sendEmail({
      to: 'elijahmuchui96@gmail.com',
      subject: 'New Payment Initiated',
      html: `
        <h3>New Payment Initiated</h3>
        <p><strong>Tenant:</strong> ${rentPayment.tenant.name}</p>
        <p><strong>Amount:</strong> ${amount}</p>
        <p><strong>Method:</strong> ${paymentMethod}</p>
        <p><strong>Property:</strong> ${rentPayment.property.name}</p>
        <p><strong>Paid At:</strong> ${rentPayment.paidAt || 'Pending'}</p>
      `,
    });

    if (paymentMethod === 'mpesa') {
      const tenant = await prisma.user.findUnique({ where: { id: tenantId } });

      if (!tenant || !tenant.phone) {
        return res.status(400).json({ message: 'Tenant phone number required for M-Pesa' });
      }

      // Normalize tenant phone number
      let phone = tenant.phone;
      if (phone.startsWith('07')) phone = '254' + phone.slice(1);
      else if (phone.startsWith('+254')) phone = phone.slice(1);
      else if (!phone.startsWith('254')) {
        return res.status(400).json({ message: 'Invalid phone number format' });
      }

      const mpesaResponse = await initiateStkPush({
        phone,
        amount: Math.ceil(totalAmount),
        accountReference: `Rent-${propertyId}`,
        transactionDesc: 'Rent Payment',
      });

      rentPayment = await prisma.rentPayment.update({
        where: { id: rentPayment.id },
        data: {
          mpesaCheckoutRequestID: mpesaResponse.CheckoutRequestID,
        },
      });
    }

    res.status(201).json({ message: 'Rent payment recorded', rentPayment });
  } catch (error) {
    console.error('Payment error:', error?.response?.data || error);
    res.status(500).json({ message: 'Server error while making payment', error });
  }
};

// ✅ NEW: Payment to list a new property (Ksh. 200)
export const payToListProperty = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Normalize phone to Safaricom 2547 format
    let formattedPhone = phone;
    if (phone.startsWith('07')) {
      formattedPhone = '254' + phone.slice(1);
    } else if (phone.startsWith('+254')) {
      formattedPhone = phone.slice(1);
    } else if (!phone.startsWith('254')) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    const amount = 200;

    const mpesaResponse = await initiateStkPush({
      phone: formattedPhone,
      amount,
      accountReference: `Listing-${userId}`,
      transactionDesc: 'Property Listing Fee',
    });

    await prisma.listingPayment.create({
      data: {
        userId,
        amount,
        phone: formattedPhone,
        mpesaCheckoutRequestID: mpesaResponse.CheckoutRequestID,
        status: 'pending',
      },
    });

    res.status(200).json({
      message: 'STK Push initiated',
      checkoutRequestID: mpesaResponse.CheckoutRequestID,
    });
  } catch (error) {
    console.error('Error during listing payment:', error?.response?.data || error);
    res.status(500).json({ message: 'Failed to initiate listing payment', error });
  }
};
