import express from 'express';
import axios from 'axios';
import { getMpesaAccessToken } from '../utils/mpesaService.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

// Verify STK push by CheckoutRequestID
router.post('/verify', authenticate, async (req, res) => {
  const { checkoutId } = req.body;

  if (!checkoutId) {
    return res.status(400).json({ message: 'CheckoutRequestID is required' });
  }

  try {
    const accessToken = await getMpesaAccessToken();

    const response = await axios.post(
      `${process.env.MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: Buffer.from(
          `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${new Date()
            .toISOString()
            .replace(/[^0-9]/g, '')
            .slice(0, 14)}`
        ).toString('base64'),
        Timestamp: new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14),
        CheckoutRequestID: checkoutId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const resultCode = response.data?.ResultCode;

    if (resultCode === 0) {
      return res.json({ success: true, message: 'Payment confirmed' });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed',
        data: response.data,
      });
    }
  } catch (err) {
    console.error('M-Pesa STK Query Error:', err?.response?.data || err.message);
    return res.status(500).json({ message: 'Failed to verify payment' });
  }
});

export default router;
