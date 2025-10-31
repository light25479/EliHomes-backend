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

// Multer config to handle file uploads in memory
export const upload = multer({ storage: multer.memoryStorage() });

// 🔹 Helper to transform media for frontend (detect videos)
const transformMedia = (media) =>
  media.map((item) => {
    const isVideo =
      item.resourceType === 'video' || item.mimeType?.startsWith('video') || item.url?.endsWith('.mp4');
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
    if (!ownerId) return res.status(401).json({ message: 'Unauthorized' });

    // Upload files to Cloudinary
    const uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, file.mimetype);
        uploadedFiles.push({
          url: result.secure_url,
          publicId: result.public_id,
          mimeType: file.mimetype,
          resourceType: file.mimetype.startsWith('video') ? 'video' : 'image',
        });
      }
    }

    // Create property with media
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
          create: uploadedFiles.map((f) => ({
            url: f.url,
            mimeType: f.mimeType,
            resourceType: f.resourceType,
            publicId: f.publicId,
          })),
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

    res.status(200).json({
      listings: properties.map((prop) => ({
        ...prop,
        images: transformMedia(prop.images),
      })),
    });
  } catch (error) {
    console.error('❌ Failed to fetch properties for owner:', error);
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

    // Remove old images if requested
    let idsToRemove = [];
    const removeImageIdsRaw = req.body?.removeImageIds;
    if (removeImageIdsRaw) {
      if (Array.isArray(removeImageIdsRaw)) {
        idsToRemove = removeImageIdsRaw.map(Number).filter((id) => !isNaN(id));
      } else if (typeof removeImageIdsRaw === 'string') {
        idsToRemove = removeImageIdsRaw.split(',').map(Number).filter((id) => !isNaN(id));
      }

      if (idsToRemove.length > 0) {
        const imagesToDelete = await prisma.propertyImage.findMany({
          where: { id: { in: idsToRemove }, propertyId },
        });

        // Delete from Cloudinary
        await Promise.all(
          imagesToDelete.map((img) =>
            cloudinary.uploader.destroy(img.publicId, { resource_type: img.resourceType })
          )
        );

        await prisma.propertyImage.deleteMany({
          where: { id: { in: idsToRemove }, propertyId },
        });
      }
    }

    // Upload new files if any
    const newImagesData = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, file.mimetype);
        newImagesData.push({
          url: result.secure_url,
          mimeType: file.mimetype,
          resourceType: file.mimetype.startsWith('video') ? 'video' : 'image',
          publicId: result.public_id,
          propertyId,
        });
      }
      await prisma.propertyImage.createMany({ data: newImagesData });
    }

    // Update property fields
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

    // Delete related media from Cloudinary
    await Promise.all(
      property.images.map((img) =>
        cloudinary.uploader.destroy(img.publicId, { resource_type: img.resourceType })
      )
    );

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















