"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const imageController_1 = require("../controllers/imageController");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public routes
router.get('/public', imageController_1.getPublicImages);
router.get('/:id', imageController_1.getImage);
// Protected routes (require authentication)
router.use(authMiddleware_1.authenticate);
// Upload multiple images with metadata
// Expected body: multipart/form-data with:
// - files: array of image files
// - metadata: JSON string with array of metadata objects
router.post('/upload', uploadMiddleware_1.upload.array('files'), imageController_1.uploadImages);
// Get user's images with pagination
router.get('/', imageController_1.getUserImages);
// Search images by description, filename, or options
router.get('/search', imageController_1.searchImages);
// Get images by specific option type and value
router.get('/options/:type/:value?', imageController_1.getImagesByOption);
// Update image metadata
router.put('/:id', imageController_1.updateImage);
// Delete image
router.delete('/:id', imageController_1.deleteImage);
exports.default = router;
