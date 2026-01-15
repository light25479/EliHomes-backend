import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handleMpesaCallback = async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;

    if (!callback) {
      return res.status(400).json({ message: 'Invalid M-Pesa callback payload' });
    }

    const {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callback;

    console.log('📥 M-Pesa Callback:', JSON.stringify(callback, null, 2));

    const items = CallbackMetadata?.Item || [];
    const receiptItem = items.find(i => i.Name === 'MpesaReceiptNumber');
    const phoneItem = items.find(i => i.Name === 'PhoneNumber');
    const accountItem = items.find(i => i.Name === 'AccountReference');

    const mpesaReceiptNumber = receiptItem?.Value || 'UNKNOWN';
    const phone = phoneItem?.Value?.toString();
    const accountRef = accountItem?.Value;

    /* =====================================================
       1️⃣ CONTACT UNLOCK PAYMENT (Ksh 50)
    ====================================================== */
    if (accountRef?.startsWith('CONTACT-')) {
      const propertyId = Number(accountRef.replace('CONTACT-', ''));

      if (ResultCode === 0 && propertyId && phone) {
        await prisma.contactAccess.upsert({
          where: {
            userId_propertyId: {
              userId: phone, // phone-based access
              propertyId,
            },
          },
          update: {},
          create: {
            userId: phone,
            propertyId,
          },
        });

        console.log('✅ Contact unlocked for property:', propertyId);

        return res.json({ message: 'Contact access granted' });
      }

      return res.json({ message: `Contact unlock failed: ${ResultDesc}` });
    }

    /* =====================================================
       2️⃣ RENT PAYMENT
    ====================================================== */
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

      return res.json({ message: 'Payment completed' });
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

      return res.json({ message: `Payment failed: ${ResultDesc}` });
    }
  } catch (error) {
    console.error('⚠️ Callback error:', error);
    res.status(500).json({ message: 'Callback handling failed' });
  }
};


