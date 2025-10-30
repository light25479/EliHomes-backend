// utils/paymentUtils.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export function calculateServiceCharge(amount, method) {
  const rate = method === 'mpesa' ? 0.015 : method === 'card' ? 0.02 : 0.01;
  return Math.round(amount * rate * 100) / 100;
}

export async function getDestinationAccount(userId) {
  const paymentDetail = await prisma.paymentDetails.findFirst({
    where: { userId },
  });
  return paymentDetail?.accountNumber || 'NOT_SET';
}
