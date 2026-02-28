import express from 'express';
import axios from 'axios';
import prisma from '../lib/prisma.js';
import { handleMpesaCallback } from '../controllers/mpesaController.js';

const router = express.Router();

const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL;

if (
  !MPESA_SHORTCODE ||
  !MPESA_PASSKEY ||
  !MPESA_CONSUMER_KEY ||
  !MPESA_CONSUMER_SECRET ||
  !CALLBACK_URL
) {
  throw new Error('Missing required M-Pesa environment variables');
}

/* ================================
   Normalize phone number
================================ */
const normalizePhoneNumber = (phone) => {
  if (!phone) return null;
  if (phone.startsWith('+')) phone = phone.slice(1);
  if (phone.startsWith('0')) return `254${phone.slice(1)}`;
  if (phone.startsWith('254')) return phone;
  return `254${phone}`;
};

/* ================================
   Get M-Pesa Access Token
================================ */
const getAccessToken = async () => {
  const response = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      auth: {
        username: MPESA_CONSUMER_KEY,
        password: MPESA_CONSUMER_SECRET,
      },
    }
  );

  return response.data.access_token;
};

/* =====================================================
   1️⃣ LISTING PAYMENT (LOGIN OPTIONAL)
===================================================== */
router.post('/initiate-payment', async (req, res) => {
  const { phoneNumber, userId } = req.body;

  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    const amount = 200;

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, '0')}${String(now.getDate()).padStart(
      2,
      '0'
    )}${String(now.getHours()).padStart(2, '0')}${String(
      now.getMinutes()
    ).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    const password = Buffer.from(
      `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const accessToken = await getAccessToken();

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: normalizedPhone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: normalizedPhone,
        CallBackURL: CALLBACK_URL,
        AccountReference: userId
          ? `LISTING-${userId}`
          : `GUEST-LISTING`,
        TransactionDesc: 'EliHomes Listing Payment',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const { CheckoutRequestID } = response.data || {};

    await prisma.listingPayment.create({
      data: {
        userId: userId || null,
        amount,
        phone: normalizedPhone,
        mpesaCheckoutRequestID: CheckoutRequestID || 'MISSING-ID',
        paid: false,
      },
    });

    res.json({
      message: 'STK Push sent successfully',
      checkoutRequestId: CheckoutRequestID,
    });
  } catch (err) {
    console.error('❌ Listing payment error:', err?.response?.data || err.message);
    res.status(500).json({ message: 'Failed to initiate payment' });
  }
});

/* =====================================================
   2️⃣ CONTACT UNLOCK (NO LOGIN REQUIRED)
===================================================== */
router.post('/unlock-contacts', async (req, res) => {
  const { phoneNumber, propertyId } = req.body;

  if (!phoneNumber || !propertyId) {
    return res
      .status(400)
      .json({ message: 'Phone and propertyId are required' });
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const amount = 50;

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, '0')}${String(now.getDate()).padStart(
      2,
      '0'
    )}${String(now.getHours()).padStart(2, '0')}${String(
      now.getMinutes()
    ).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    const password = Buffer.from(
      `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const accessToken = await getAccessToken();

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: normalizedPhone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: normalizedPhone,
        CallBackURL: CALLBACK_URL,
        AccountReference: `CONTACT-${propertyId}`,
        TransactionDesc: 'Unlock Property Contacts',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    res.json({
      message: 'STK Push sent',
      checkoutRequestId: response.data.CheckoutRequestID,
    });
  } catch (err) {
    console.error('❌ Unlock contact error:', err?.response?.data || err.message);
    res.status(500).json({ message: 'Failed to initiate payment' });
  }
});

/* =====================================================
   3️⃣ CALLBACK
===================================================== */
router.post('/callback', handleMpesaCallback);

export default router;


