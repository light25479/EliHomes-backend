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
import { checkPaymentOptional } from '../middleware/paymentCheck.js';

const router = express.Router();

// ✅ Setup Multer for handling multiple image/video uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Upload + Create Property (supports both images and videos)
router.post(
  '/',
  authMiddleware,
  checkPaymentOptional('LISTING'),
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 },
  ]),
  createProperty
);

// ✅ Owner-specific properties
router.get('/owner', authMiddleware, getPropertiesByOwner);

// ✅ Update Property (supports both images and videos)
router.put(
  '/:id',
  authMiddleware,
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 },
  ]),
  updateProperty
);

// ✅ Delete Property
router.delete('/:id', authMiddleware, deleteProperty);

// ✅ Public routes
router.post('/search', searchProperties); // Search with filters
router.get('/:id', getPropertyById); // Get property by ID

export default router;

