// ==================
// 🏡 PROPERTY CONTROLLERS
// ==================
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

// Multer setup for memory storage
export const upload = multer({ storage: multer.memoryStorage() });

// Cloudinary upload helper
const uploadToCloudinary = (fileBuffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const isVideo = mimetype.startsWith('video/');
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'elihomes_uploads', resource_type: isVideo ? 'video' : 'image' },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(fileBuffer);
  });
};

// Transform media for frontend
const transformMedia = (media) =>
  media.map((item) => ({
    id: item.id,
    url: item.url,
    resourceType:
      item.mimeType?.startsWith('video') || item.url?.endsWith('.mp4') ? 'video' : 'image',
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

    // Upload files if any
    const uploadedFiles = [];
    if (req.files) {
      const images = Array.isArray(req.files['images']) ? req.files['images'] : [];
      const videos = Array.isArray(req.files['videos']) ? req.files['videos'] : [];
      const allFiles = [...images, ...videos];

      for (const file of allFiles) {
        const result = await uploadToCloudinary(file.buffer, file.mimetype);

        uploadedFiles.push({
          url: result.secure_url,
          mimeType: file.mimetype,
          publicId: result.public_id, // ✅ FIX
        });
      }
    }

    // Create property in Prisma
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
        images: uploadedFiles.length ? { create: uploadedFiles } : undefined,
      },
      include: { images: true },
    });

    res.status(201).json({
      property: { ...newProperty, images: transformMedia(newProperty.images) },
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
    if (isNaN(propertyId)) return res.status(400).json({ message: 'Invalid property ID' });

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { images: true },
    });

    if (!property) return res.status(404).json({ message: 'Property not found' });

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

        // Contacts always visible
        contactEmail: property.contactEmail,
        contactPhone: property.contactPhone,
        contactWhatsapp: property.contactWhatsapp,
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
    const { query, location, roomType, minPrice, maxPrice, electricity, wifi, water } = req.body;

    const whereConditions = [];

    if (query || location) {
      const orConditions = [];
      if (query) orConditions.push({ title: { contains: query, mode: 'insensitive' } });
      if (location) orConditions.push({ location: { contains: location, mode: 'insensitive' } });
      if (orConditions.length) whereConditions.push({ OR: orConditions });
    }

    if (roomType) whereConditions.push({ roomType: { contains: roomType, mode: 'insensitive' } });

    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (!isNaN(Number(minPrice))) priceFilter.gte = Number(minPrice);
      if (!isNaN(Number(maxPrice))) priceFilter.lte = Number(maxPrice);
      if (Object.keys(priceFilter).length) whereConditions.push({ price: priceFilter });
    }

    if (electricity === true || electricity === 'true') whereConditions.push({ electricity: true });
    if (wifi === true || wifi === 'true') whereConditions.push({ wifi: true });
    if (water === true || water === 'true') whereConditions.push({ water: true });

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
      await prisma.propertyImage.deleteMany({ where: { id: { in: idsToRemove }, propertyId } });
    }

    // Upload new files to Cloudinary
const newImagesData = [];
if (req.files) {
  const filesArray = [...(req.files['images'] || []), ...(req.files['videos'] || [])];

  for (const file of filesArray) {
    const result = await uploadToCloudinary(file.buffer, file.mimetype);

    newImagesData.push({
      url: result.secure_url,
      mimeType: file.mimetype || 'image/jpeg',
      publicId: result.public_id, // ✅ FIX
      propertyId,
    });
  }

  if (newImagesData.length) {
    await prisma.propertyImage.createMany({ data: newImagesData });
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

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { images: true },
    });

    if (!property || property.ownerId !== ownerId)
      return res.status(403).json({ message: 'Unauthorized or property not found' });

    // Delete files from Cloudinary
    for (const image of property.images) {
      if (image.publicId) {
        await cloudinary.uploader.destroy(image.publicId, {
          resource_type: image.mimeType?.startsWith('video') ? 'video' : 'image',
        });
      }
    }

    // Delete related images from DB
    await prisma.propertyImage.deleteMany({ where: { propertyId } });

    // Delete property
    await prisma.property.delete({ where: { id: propertyId } });

    res.status(200).json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('❌ Failed to delete property:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




















