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
    const isVideo = mimetype.startsWith('video/');
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

// Multer config to handle file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// 🔹 Helper to transform images/videos for frontend
const transformMedia = (media) =>
  media.map((m) => ({
    id: m.id,
    url: m.url,
    type: m.resourceType,
  }));

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
    if (!ownerId) return res.status(401).json({ message: 'Unauthorized' });

    // ✅ Upload images & videos to Cloudinary
    const uploadedFiles = [];

    if (req.files) {
      // Combine all uploaded images and videos into one array
      const allFiles = [
        ...(req.files['images'] || []),
        ...(req.files['videos'] || []),
      ];

      for (const file of allFiles) {
        const result = await uploadToCloudinary(file.buffer, file.mimetype);
        uploadedFiles.push({
          url: result.secure_url,
          publicId: result.public_id, // ✅ Cloudinary public ID
          resourceType:
            result.resource_type ||
            (file.mimetype.startsWith('video/') ? 'video' : 'image'),
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
        images: {
          create: uploadedFiles,
        },
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ======================================================
// 🏠 GET PROPERTY BY ID
// ======================================================
export const getPropertyById = async (req, res) => {
  try {
    const propertyId = Number(req.params.id);
    if (isNaN(propertyId))
      return res.status(400).json({ message: 'Invalid property ID' });

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { images: true },
    });

    if (!property) return res.status(404).json({ message: 'Property not found' });

    res.status(200).json({
      property: {
        ...property,
        images: transformMedia(property.images),
      },
    });
  } catch (error) {
    console.error('❌ Failed to fetch property:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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

    const listings = properties.map((prop) => ({
      ...prop,
      images: transformMedia(prop.images),
    }));

    res.status(200).json({ listings });
  } catch (error) {
    console.error('❌ Failed to fetch properties for owner:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
        orConditions.push({ title: { contains: query, mode: 'insensitive' } });
      if (location)
        orConditions.push({ location: { contains: location, mode: 'insensitive' } });
      if (orConditions.length) whereConditions.push({ OR: orConditions });
    }

    if (roomType)
      whereConditions.push({ roomType: { contains: roomType, mode: 'insensitive' } });

    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (!isNaN(Number(minPrice))) priceFilter.gte = Number(minPrice);
      if (!isNaN(Number(maxPrice))) priceFilter.lte = Number(maxPrice);
      if (Object.keys(priceFilter).length) whereConditions.push({ price: priceFilter });
    }

    if (electricity === true || electricity === 'true')
      whereConditions.push({ electricity: true });
    if (wifi === true || wifi === 'true') whereConditions.push({ wifi: true });
    if (water === true || water === 'true') whereConditions.push({ water: true });

    const properties = await prisma.property.findMany({
      where: { AND: whereConditions },
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ======================================================
// ✏️ UPDATE PROPERTY
// ======================================================
export const updateProperty = async (req, res) => {
  try {
    const propertyId = Number(req.params.id);
    const ownerId = req.user?.id;
    if (!ownerId) return res.status(401).json({ message: 'Unauthorized' });

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { images: true },
    });

    if (!property || property.ownerId !== ownerId)
      return res.status(403).json({ message: 'Unauthorized or property not found' });

    // Handle removed images
    let idsToRemove = [];
    const removeImageIdsRaw = req.body?.removeImageIds;
    if (removeImageIdsRaw) {
      if (Array.isArray(removeImageIdsRaw)) {
        idsToRemove = removeImageIdsRaw.map((id) => Number(id)).filter((id) => !isNaN(id));
      } else if (typeof removeImageIdsRaw === 'string') {
        idsToRemove = removeImageIdsRaw
          .split(',')
          .map((id) => Number(id))
          .filter((id) => !isNaN(id));
      }
    }
    if (idsToRemove.length) {
      await prisma.propertyImage.deleteMany({
        where: { id: { in: idsToRemove }, propertyId },
      });
    }

    // Upload new files to Cloudinary
    const newMediaData = [];
    if (req.files) {
      const allFiles = [
        ...(req.files['images'] || []),
        ...(req.files['videos'] || []),
      ];

      for (const file of allFiles) {
        const result = await uploadToCloudinary(file.buffer, file.mimetype);
        newMediaData.push({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType:
            result.resource_type ||
            (file.mimetype.startsWith('video/') ? 'video' : 'image'),
          propertyId,
        });
      }

      if (newMediaData.length > 0) {
        await prisma.propertyImage.createMany({ data: newMediaData });
      }
    }

    // Update property fields safely
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        title: req.body?.title ?? property.title,
        description: req.body?.description ?? property.description,
        price: req.body?.price ? Number(req.body.price) : property.price,
        location: req.body?.location ?? property.location,
        roomType: req.body?.roomType ?? property.roomType,
        electricity:
          req.body?.electricity !== undefined
            ? req.body.electricity === true || req.body.electricity === 'true'
            : property.electricity,
        wifi:
          req.body?.wifi !== undefined
            ? req.body.wifi === true || req.body.wifi === 'true'
            : property.wifi,
        water:
          req.body?.water !== undefined
            ? req.body.water === true || req.body.water === 'true'
            : property.water,
        contactEmail: req.body?.contactEmail ?? property.contactEmail,
        contactPhone: req.body?.contactPhone ?? property.contactPhone,
        contactWhatsapp: req.body?.contactWhatsapp ?? property.contactWhatsapp,
      },
      include: { images: true },
    });

    res.status(200).json({
      property: {
        ...updatedProperty,
        images: transformMedia(updatedProperty.images),
      },
    });
  } catch (error) {
    console.error('❌ Failed to update property:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ======================================================
// ❌ DELETE PROPERTY
// ======================================================
export const deleteProperty = async (req, res) => {
  try {
    const propertyId = Number(req.params.id);
    const ownerId = req.user?.id;
    if (!ownerId) return res.status(401).json({ message: 'Unauthorized' });

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property || property.ownerId !== ownerId)
      return res.status(403).json({ message: 'Unauthorized or property not found' });

    // Delete related images
    await prisma.propertyImage.deleteMany({ where: { propertyId } });

    // Delete property
    await prisma.property.delete({ where: { id: propertyId } });

    res.status(200).json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('❌ Failed to delete property:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



