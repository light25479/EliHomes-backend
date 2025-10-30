// controllers/paymentExportController.js (ESM version)
import { PrismaClient } from '@prisma/client';
import { Parser } from 'json2csv';

const prisma = new PrismaClient();

// Export Rent Payments as CSV
export const exportRentPayments = async (req, res) => {
  try {
    const payments = await prisma.rentPayment.findMany({
      include: {
        tenant: { select: { name: true, email: true } },
        property: { select: { name: true } },
        agent: { select: { name: true } },
      },
    });

    const data = payments.map(p => ({
      ID: p.id,
      Tenant: p.tenant.name,
      Email: p.tenant.email,
      Property: p.property.name,
      Agent: p.agent?.name || 'N/A',
      Amount: p.amount,
      ServiceCharge: p.serviceCharge,
      Total: p.totalAmount,
      Method: p.paymentMethod,
      Status: p.status,
      PaidAt: p.paidAt,
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('rent_payments.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Failed to export rent payments' });
  }
};

// Export Bill Payments as CSV
export const exportBillPayments = async (req, res) => {
  try {
    const bills = await prisma.billPayment.findMany({
      include: {
        tenant: { select: { name: true, email: true } },
        property: { select: { name: true } },
      },
    });

    const data = bills.map(b => ({
      ID: b.id,
      Tenant: b.tenant.name,
      Email: b.tenant.email,
      Property: b.property.name,
      Amount: b.amount,
      ServiceCharge: b.serviceCharge,
      Total: b.totalAmount,
      Method: b.paymentMethod,
      Status: b.status,
      PaidAt: b.paidAt,
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('bill_payments.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Failed to export bill payments' });
  }
};
