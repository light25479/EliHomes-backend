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

// ✅ Setup Multer for handling multiple uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Upload + Create Property (frontend sends all files under 'files')
router.post(
  '/',
  authMiddleware,
  checkPaymentOptional('LISTING'),
  upload.array('files', 20), // <--- Accept up to 20 files (images or videos)
  createProperty
);

// ✅ Owner-specific properties
router.get('/owner', authMiddleware, getPropertiesByOwner);

// ✅ Update Property (also accepts 'files')
router.put(
  '/:id',
  authMiddleware,
  upload.array('files', 20), // same here for consistency
  updateProperty
);

// ✅ Delete Property
router.delete('/:id', authMiddleware, deleteProperty);

// ✅ Public routes
router.post('/search', searchProperties);
router.get('/:id', getPropertyById);

export default router;


