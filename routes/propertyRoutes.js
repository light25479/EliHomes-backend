// routes/propertyRoutes.js
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

// ✅ Setup Multer for handling multiple images in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Upload + Create Property (with multiple images)
router.post(
  '/',
  authMiddleware,
  checkPaymentOptional('LISTING'),
  upload.array('images', 10), // allow up to 10 images
  createProperty // use the updated controller
);

// ✅ Owner-specific properties
router.get('/owner', authMiddleware, getPropertiesByOwner);

// ✅ Update/Delete
router.put('/:id', authMiddleware, upload.array('images', 10), updateProperty);
router.delete('/:id', authMiddleware, deleteProperty);

// ✅ Public routes
router.post('/search', searchProperties); // search with filters
router.get('/:id', getPropertyById); // get property by ID

export default router;
