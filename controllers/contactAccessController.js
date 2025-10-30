import prisma from '../lib/prisma.js';

// Check if user has access to contact info
export const checkContactAccess = async (req, res) => {
  const { userId, propertyId } = req.query;

  if (!userId || !propertyId) {
    return res.status(400).json({ error: 'userId and propertyId are required' });
  }

  try {
    const access = await prisma.contactAccess.findUnique({
      where: {
        userId_propertyId: {
          userId: Number(userId),
          propertyId: Number(propertyId),
        },
      },
    });

    res.json({ accessGranted: !!access });
  } catch (error) {
    console.error('Error checking access:', error);
    res.status(500).json({ error: 'Failed to check access' });
  }
};

// Grant access after payment
export const grantContactAccess = async (req, res) => {
  const { userId, propertyId } = req.body;

  if (!userId || !propertyId) {
    return res.status(400).json({ error: 'userId and propertyId are required' });
  }

  try {
    const newAccess = await prisma.contactAccess.create({
      data: {
        userId: Number(userId),
        propertyId: Number(propertyId),
      },
    });

    res.json({ success: true, access: newAccess });
  } catch (error) {
    console.error('Error granting access:', error);
    res.status(500).json({ error: 'Failed to grant access' });
  }
};
