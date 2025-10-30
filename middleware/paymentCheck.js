import prisma from '../lib/prisma.js';

// ✅ Strict payment enforcement middleware
export const checkPayment = (type = 'LISTING') => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized. No user ID found.' });
      }

      const amountRequired = type === 'CONTACT_ACCESS' ? 50 : 100;

      const hasPaid = await prisma.listingPayment.findFirst({
        where: {
          userId,
          amount: amountRequired,
          paid: true,
        },
      });

      if (!hasPaid) {
        return res.status(402).json({
          message: `Payment of Ksh ${amountRequired} required for ${type}`,
        });
      }

      next();
    } catch (error) {
      console.error('❌ Payment check error:', error);
      res.status(500).json({ message: 'Payment verification failed' });
    }
  };
};

// ✅ Optional payment check (logs but does not block)
export const checkPaymentOptional = (type = 'LISTING') => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized. No user ID found.' });
      }

      const requiredAmount = type === 'CONTACT_ACCESS' ? 50 : 100;

      const hasPaid = await prisma.listingPayment.findFirst({
        where: {
          userId,
          amount: requiredAmount,
          paid: true,
        },
      });

      console.log(`🔍 Optional payment check for ${type} — Paid: ${!!hasPaid}`);

      // Always allow access for now
      next();
    } catch (error) {
      console.error('❌ Optional payment check error:', error);
      next(); // Let the request go through
    }
  };
};
