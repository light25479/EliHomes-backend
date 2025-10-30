import express from 'express';
import axios from 'axios';
import authMiddleware from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Initiate M-Pesa STK Push
router.post('/start', authMiddleware, async (req, res) => {
  const { phoneNumber } = req.body;
  const userId = req.user.id;

  try {
    // Save pending payment
    const newPayment = await prisma.listingPayment.create({
      data: {
        userId,
        amount: 200,
        status: 'pending',
      },
    });

    // Simulate M-Pesa STK push (real M-Pesa logic should be placed here)
    // This is a placeholder for actual M-Pesa logic
    console.log(`Simulating M-Pesa STK push for ${phoneNumber}`);

    // Return paymentId to frontend
    res.status(200).json({ paymentId: newPayment.id, message: 'STK push initiated (simulated)' });
  } catch (error) {
    console.error('Failed to initiate listing payment:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// Confirm payment manually (simulate M-Pesa callback)
router.post('/confirm', authMiddleware, async (req, res) => {
  const { paymentId } = req.body;
  const userId = req.user.id;

  try {
    const payment = await prisma.listingPayment.updateMany({
      where: { id: paymentId, userId },
      data: { status: 'paid' },
    });

    res.status(200).json({ message: 'Payment confirmed successfully.' });
  } catch (error) {
    console.error('Failed to confirm payment:', error);
    res.status(500).json({ error: 'Payment confirmation failed.' });
  }
});

// Get payment status
router.get('/:id', authMiddleware, async (req, res) => {
  const paymentId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const payment = await prisma.listingPayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || payment.userId !== userId) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.status(200).json({ status: payment.status });
  } catch (error) {
    console.error('Failed to fetch payment status:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

export default router;
