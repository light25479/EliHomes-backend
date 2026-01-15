import prisma from '../lib/prisma.js';

// ✅ Check if a phone has access to a property
export const checkContactAccess = async (req, res) => {
  try {
    const { propertyId, phone } = req.query;

    if (!propertyId || !phone) {
      return res.status(400).json({ message: 'propertyId and phone are required' });
    }

    const access = await prisma.contactAccess.findFirst({
      where: {
        propertyId: Number(propertyId),
        userId: phone, // phone stored as userId in ContactAccess
      },
    });

    res.json({ hasAccess: !!access });
  } catch (err) {
    console.error('Check Contact Access Error:', err);
    res.status(500).json({ message: 'Failed to check contact access' });
  }
};

// ✅ Grant access manually (optional)
export const grantContactAccess = async (req, res) => {
  try {
    const { propertyId, phone } = req.body;

    if (!propertyId || !phone) {
      return res.status(400).json({ message: 'propertyId and phone are required' });
    }

    const access = await prisma.contactAccess.upsert({
      where: {
        userId_propertyId: {
          userId: phone,
          propertyId: Number(propertyId),
        },
      },
      update: {},
      create: {
        userId: phone,
        propertyId: Number(propertyId),
      },
    });

    res.json({ message: '✅ Access granted', access });
  } catch (err) {
    console.error('Grant Contact Access Error:', err);
    res.status(500).json({ message: 'Failed to grant access' });
  }
};



