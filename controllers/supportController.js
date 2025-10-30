import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// POST /api/support/send
export const sendSupportMessage = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const tenantId = req.user.id; // Extracted from token (tenant)

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const newMessage = await prisma.supportMessage.create({
      data: {
        tenantId,
        subject,
        message,
      },
    });

    res.status(201).json({ message: 'Support message sent', data: newMessage });
  } catch (error) {
    console.error('Error sending support message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/support/my
export const getMyMessages = async (req, res) => {
  try {
    const tenantId = req.user.id;

    const messages = await prisma.supportMessage.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
};
