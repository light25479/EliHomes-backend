import prisma from '../lib/prisma.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// ==================
// 🧩 CLOUDINARY SETUP
// ==================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper for Cloudinary upload
const uploadToCloudinary = (fileBuffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const isVideo = mimetype?.startsWith('video/');
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'elihomes_uploads',
        resource_type: isVideo ? 'video' : 'image',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// Multer config (memory storage)
export const upload = multer({ storage: multer.memoryStorage() });

// 🔹 Transform media for frontend
const transformMedia = (media) =>
  media.map((item) => {
    const isVideo =
      item.mimeType?.startsWith('video') || item.url?.endsWith('.mp4');
    return {
      id: item.id,
      url: item.url,
      resourceType: isVideo ? 'video' : 'image',
    };
  });

// ======================================================
// 🏡 CREATE PROPERTY
// ======================================================
export const createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      location,
      roomType,
      electricity,
      wifi,
      water,
      contactEmail,
      contactPhone,
      contactWhatsapp,
    } = req.body;

    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const uploadedFiles = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, file.mimetype);

        uploadedFiles.push({
          url: result.secure_url,
          mimeType: file.mimetype || 'image/jpeg',
        });
      }
    }

    const newProperty = await prisma.property.create({
      data: {
        title,
        description,
        price: Number(price),
        location,
        roomType,
        electricity: electricity === true || electricity === 'true',
        wifi: wifi === true || wifi === 'true',
        water: water === true || water === 'true',
        ownerId,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        contactWhatsapp: contactWhatsapp || null,
        images: uploadedFiles.length
          ? {
              create: uploadedFiles,
            }
          : undefined,
      },
      include: { images: true },
    });

    res.status(201).json({
      property: {
        ...newProperty,
        images: transformMedia(newProperty.images),
      },
    });
  } catch (error) {
    console.error('❌ Failed to create property:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// ======================================================
// 🏠 GET PROPERTY BY ID (CONTACTS ALWAYS VISIBLE)
// ======================================================
export const getPropertyById = async (req, res) => {
  try {
    const propertyId = Number(req.params.id);

    if (isNaN(propertyId)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { images: true },
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.status(200).json({
      property: {
        id: property.id,
        title: property.title,
        description: property.description,
        price: property.price,
        location: property.location,
        roomType: property.roomType,
        electricity: property.electricity,
        wifi: property.wifi,
        water: property.water,
        createdAt: property.createdAt,
        images: transformMedia(property.images),

        // ✅ Contacts always included
        contactEmail: property.contactEmail,
        contactPhone: property.contactPhone,
        contactWhatsapp: property.contactWhatsapp,
      },
    });
  } catch (error) {
    console.error('❌ Failed to fetch property:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ======================================================
// 👤 GET PROPERTIES BY OWNER
// ======================================================
export const getPropertiesByOwner = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) return res.status(401).json({ message: 'Unauthorized' });

    const properties = await prisma.property.findMany({
      where: { ownerId },
      include: { images: true },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      listings: properties.map((prop) => ({
        ...prop,
        images: transformMedia(prop.images),
      })),
    });
  } catch (error) {
    console.error('❌ Failed to fetch properties for owner:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// ======================================================
// 🔍 SEARCH PROPERTIES
// ======================================================
export const searchProperties = async (req, res) => {
  try {
    const {
      query,
      location,
      roomType,
      minPrice,
      maxPrice,
      electricity,
      wifi,
      water,
    } = req.body;

    const whereConditions = [];

    if (query || location) {
      const orConditions = [];
      if (query)
        orConditions.push({
          title: { contains: query, mode: 'insensitive' },
        });
      if (location)
        orConditions.push({
          location: { contains: location, mode: 'insensitive' },
        });

      if (orConditions.length) {
        whereConditions.push({ OR: orConditions });
      }
    }

    if (roomType) {
      whereConditions.push({
        roomType: { contains: roomType, mode: 'insensitive' },
      });
    }

    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (!isNaN(Number(minPrice)))
        priceFilter.gte = Number(minPrice);
      if (!isNaN(Number(maxPrice)))
        priceFilter.lte = Number(maxPrice);

      if (Object.keys(priceFilter).length) {
        whereConditions.push({ price: priceFilter });
      }
    }

    if (electricity === true || electricity === 'true')
      whereConditions.push({ electricity: true });

    if (wifi === true || wifi === 'true')
      whereConditions.push({ wifi: true });

    if (water === true || water === 'true')
      whereConditions.push({ water: true });

    const properties = await prisma.property.findMany({
      where: whereConditions.length ? { AND: whereConditions } : {},
      include: { images: true },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      properties: properties.map((prop) => ({
        ...prop,
        images: transformMedia(prop.images),
      })),
    });
  } catch (error) {
    console.error('❌ Failed to search properties:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// ======================================================
// ❌ DELETE PROPERTY
// ======================================================
export const deleteProperty = async (req, res) => {
  try {
    const propertyId = Number(req.params.id);
    const ownerId = req.user?.id;

    if (!ownerId)
      return res.status(401).json({ message: 'Unauthorized' });

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.ownerId !== ownerId)
      return res.status(403).json({
        message: 'Unauthorized or property not found',
      });

    await prisma.propertyImage.deleteMany({
      where: { propertyId },
    });

    await prisma.property.delete({
      where: { id: propertyId },
    });

    res.status(200).json({
      message: 'Property deleted successfully',
    });
  } catch (error) {
    console.error('❌ Failed to delete property:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};




















