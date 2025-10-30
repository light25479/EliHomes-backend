import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get the property assigned to the logged-in tenant
export const getAssignedProperty = async (req, res) => {
  try {
    const tenantId = req.user.id;
    const property = await prisma.property.findFirst({ where: { tenantId } });

    if (!property) {
      return res.status(404).json({ message: "No property assigned yet" });
    }

    res.json(property);
  } catch (error) {
    console.error("Error getting assigned property:", error);
    res.status(500).json({ message: "Error fetching assigned property" });
  }
};

export const getMyRentPayments = async (req, res) => {
  const userId = req.user.id;

  try {
    const payments = await prisma.rentPayment.findMany({
      where: { tenantId: userId },
      include: { property: true, agent: true },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(payments);
  } catch (error) {
    console.error('❌ Error fetching tenant payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyBills = async (req, res) => {
  const userId = req.user.id;

  try {
    const bills = await prisma.bill.findMany({
      where: { tenantId: userId },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(bills);
  } catch (error) {
    console.error('❌ Error fetching tenant bills:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const payRent = async (req, res) => {
  const tenantId = req.user.id;
  const { propertyId, amount, method } = req.body;

  const serviceCharges = {
    mpesa: 0.02,
    bank: 0.015,
    card: 0.03
  };

  try {
    const serviceRate = serviceCharges[method.toLowerCase()];
    if (serviceRate === undefined) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    const serviceCharge = amount * serviceRate;
    const totalAmount = amount + serviceCharge;

    const payment = await prisma.rentPayment.create({
      data: {
        tenantId,
        propertyId,
        amount,
        method,
        serviceCharge,
        totalAmount,
        status: 'completed',
        paidAt: new Date()
      }
    });

    res.status(201).json({ message: 'Rent payment successful', payment });
  } catch (error) {
    console.error('❌ Error processing rent payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  const tenantId = req.user.id;
  const { name, email, phone } = req.body;

  try {
    const updatedTenant = await prisma.user.update({
      where: { id: tenantId },
      data: { name, email, phone }
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedTenant
    });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const contactSupport = async (req, res) => {
  const tenantId = req.user.id;
  const { subject, message } = req.body;

  try {
    const supportMessage = await prisma.supportMessage.create({
      data: { tenantId, subject, message }
    });

    res.status(201).json({
      message: 'Your message has been sent to admin',
      supportMessage
    });
  } catch (error) {
    console.error('❌ Error sending support message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTransactionHistory = async (req, res) => {
  try {
    const tenantId = req.user.id;

    const rentPayments = await prisma.rentPayment.findMany({
      where: { tenantId },
      orderBy: { paidAt: 'desc' }
    });

    const billPayments = await prisma.billPayment.findMany({
      where: { tenantId },
      orderBy: { paidAt: 'desc' }
    });

    res.status(200).json({ rentPayments, billPayments });
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ error: 'Failed to load transaction history' });
  }
};
