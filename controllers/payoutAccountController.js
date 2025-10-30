// controllers/payoutAccountController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create or update a payout account for an owner
export const setPayoutAccount = async (req, res) => {
  try {
    const { ownerId, method, account, bankName } = req.body;

    const existing = await prisma.payoutAccount.findFirst({
      where: { ownerId, method },
    });

    let updated;

    if (existing) {
      updated = await prisma.payoutAccount.update({
        where: { id: existing.id },
        data: { account, bankName },
      });
    } else {
      updated = await prisma.payoutAccount.create({
        data: { ownerId, method, account, bankName },
      });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to save payout account', error });
  }
};

// Get all payout accounts for an owner
export const getPayoutAccounts = async (req, res) => {
  try {
    const { ownerId } = req.params;

    const accounts = await prisma.payoutAccount.findMany({
      where: { ownerId: Number(ownerId) },
    });

    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payout accounts', error });
  }
};
