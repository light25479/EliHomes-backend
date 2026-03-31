import express from 'express';
import multer from 'multer';
import {
  getPropertiesByOwner,
  searchProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} from '../controllers/propertyController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Accept both images and videos
const uploadFields = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 },
]);

// Create property
router.post(
  '/',
  authMiddleware,
  uploadFields,
  createProperty
);

// Get properties by owner
router.get('/owner', authMiddleware, getPropertiesByOwner);

// Update property
router.put('/:id', authMiddleware, uploadFields, updateProperty);

// Delete property
router.delete('/:id', authMiddleware, deleteProperty);

// Search properties
router.post('/search', searchProperties);

// Get property by ID
router.get('/:id', getPropertyById);

export default router;



