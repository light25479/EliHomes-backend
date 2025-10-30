import express from 'express';
import { PrismaClient } from '@prisma/client';
import { fileTypeFromBuffer } from 'file-type';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/properties/search
router.post('/search', async (req, res) => {
  try {
    const {
      location,
      roomType,
      minPrice,
      maxPrice,
      electricity,
      wifi,
      water,
    } = req.body;

    const whereConditions = [];

    if (location) {
      whereConditions.push({
        location: { contains: location, mode: 'insensitive' },
      });
    }

    if (roomType) {
      whereConditions.push({ roomType: { equals: roomType, mode: 'insensitive' } });
    }

    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
      whereConditions.push({ price: priceFilter });
    }

    if (electricity === true || electricity === 'true') whereConditions.push({ electricity: true });
    if (wifi === true || wifi === 'true') whereConditions.push({ wifi: true });
    if (water === true || water === 'true') whereConditions.push({ water: true });

    const rawProperties = await prisma.property.findMany({
      where: { AND: whereConditions },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { name: true, email: true, phone: true, whatsapp: true, role: true } },
      },
    });

    const properties = await Promise.all(
      rawProperties.map(async (p) => {
        let formattedImage = null;

        if (p.image) {
          try {
            const buffer = Buffer.from(p.image, 'base64');
            const detectedType = await fileTypeFromBuffer(buffer);
            formattedImage = {
              data: buffer.toString('base64'),
              type: detectedType?.mime || 'image/jpeg',
            };
          } catch (err) {
            console.error(`❌ Error processing image for property ${p.id}:`, err);
          }
        }

        return { ...p, image: formattedImage };
      })
    );

    res.status(200).json({ properties });
  } catch (err) {
    console.error('❌ Search error:', err);
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
});

export default router;
