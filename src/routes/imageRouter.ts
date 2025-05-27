import express from 'express';
import {
  uploadImages,
  getUserImages,
  getImage,
  updateImage,
  deleteImage,
  getPublicImages,
  searchImages,
  getImagesByOption,
} from '../controllers/imageController';
import { upload } from '../middleware/uploadMiddleware';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/public', getPublicImages);
router.get('/:id', getImage);

// Protected routes (require authentication)
router.use(authenticate);

// Upload multiple images with metadata
// Expected body: multipart/form-data with:
// - files: array of image files
// - metadata: JSON string with array of metadata objects
router.post('/upload', upload.array('files'), uploadImages);

// Get user's images with pagination
router.get('/', getUserImages);

// Search images by description, filename, or options
router.get('/search', searchImages);

// Get images by specific option type and value
router.get('/options/:type/:value?', getImagesByOption);

// Update image metadata
router.put('/:id', updateImage);

// Delete image
router.delete('/:id', deleteImage);

export default router;
