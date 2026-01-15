// ✅ propertyRoutes.js
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

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Accept both images and videos
const uploadFields = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 },
]);

router.post(
  '/',
  authMiddleware,
  checkPaymentOptional('LISTING'),
  uploadFields,
  createProperty
);

router.get('/owner', authMiddleware, getPropertiesByOwner);
router.put('/:id', authMiddleware, uploadFields, updateProperty);
router.delete('/:id', authMiddleware, deleteProperty);
router.post('/search', searchProperties);
router.get('/:id', getPropertyById);

export default router;




