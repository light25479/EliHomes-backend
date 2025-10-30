import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Handles M-Pesa STK Push callback from Safaricom
 */
export const handleMpesaCallback = async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;

    if (!callback) {
      return res.status(400).json({ message: 'Invalid M-Pesa callback payload' });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callback;

    console.log('📥 Received M-Pesa Callback:', JSON.stringify(callback, null, 2));

    let payment = await prisma.rentPayment.findFirst({
      where: {
        mpesaCheckoutRequestID: CheckoutRequestID,
        status: 'pending',
      },
    });

    let isRent = true;

    if (!payment) {
      isRent = false;
      payment = await prisma.listingPayment.findFirst({
        where: {
          mpesaCheckoutRequestID: CheckoutRequestID,
          status: 'pending',
        },
      });
    }

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found or already processed' });
    }

    if (ResultCode === 0) {
      const items = CallbackMetadata?.Item || [];

      const amountItem = items.find(item => item.Name === 'Amount');
      const receiptItem = items.find(item => item.Name === 'MpesaReceiptNumber');

      const amount = amountItem?.Value ?? payment.amount;
      const mpesaReceiptNumber = receiptItem?.Value ?? 'UNKNOWN';

      const updateData = {
        status: 'completed',
        paidAt: new Date(),
        mpesaReceiptNumber,
      };

      if (isRent) {
        await prisma.rentPayment.update({
          where: { id: payment.id },
          data: updateData,
        });
      } else {
        await prisma.listingPayment.update({
          where: { id: payment.id },
          data: updateData,
        });
      }

      return res.status(200).json({ message: '✅ Payment successful and updated' });
    } else {
      const updateData = {
        status: 'failed',
        paidAt: new Date(),
      };

      if (isRent) {
        await prisma.rentPayment.update({
          where: { id: payment.id },
          data: updateData,
        });
      } else {
        await prisma.listingPayment.update({
          where: { id: payment.id },
          data: updateData,
        });
      }

      return res.status(200).json({ message: `❌ Payment failed: ${ResultDesc}` });
    }
  } catch (error) {
    console.error('⚠️ M-Pesa callback error:', error);
    res.status(500).json({ message: 'Server error handling callback', error });
  }
};
