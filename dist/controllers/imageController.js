"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImagesByOption = exports.searchImages = exports.getPublicImages = exports.deleteImage = exports.updateImage = exports.getImage = exports.getUserImages = exports.uploadImages = void 0;
const Image_1 = __importDefault(require("../models/Image"));
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
// Upload multiple images with metadata
const uploadImages = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({ message: 'No files uploaded' });
        return;
    }
    if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    try {
        // Parse metadata from request body
        let metadata = [];
        if (req.body.metadata) {
            try {
                metadata = JSON.parse(req.body.metadata);
            }
            catch (error) {
                res.status(400).json({ message: 'Invalid metadata format' });
                return;
            }
        }
        const uploadedImages = [];
        const files = req.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileMetadata = metadata[i] || {
                FileName: file.originalname,
                Description: '',
                Options: []
            };
            try {
                // Generate thumbnail
                const thumbnailFilename = 'thumb_' + file.filename;
                const thumbnailPath = path_1.default.join(uploadMiddleware_1.thumbnailsDir, thumbnailFilename);
                yield (0, sharp_1.default)(file.path)
                    .resize(200, 200, { fit: 'cover' })
                    .jpeg({ quality: 80 })
                    .toFile(thumbnailPath);
                // Create image record in database
                const image = yield Image_1.default.create({
                    filename: file.filename,
                    originalName: fileMetadata.FileName || file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    userId: req.user._id,
                    description: fileMetadata.Description || '',
                    options: fileMetadata.Options || [],
                    isPublic: false, // Default to private
                    url: `/uploads/${file.filename}`,
                    thumbnailUrl: `/uploads/thumbnails/${thumbnailFilename}`,
                });
                uploadedImages.push({
                    id: image._id,
                    filename: image.filename,
                    originalName: image.originalName,
                    size: image.size,
                    url: image.url,
                    thumbnailUrl: image.thumbnailUrl,
                    description: image.description,
                    options: image.options,
                    uploadDate: image.uploadDate,
                });
            }
            catch (error) {
                // Clean up uploaded file if processing fails
                if (fs_1.default.existsSync(file.path)) {
                    fs_1.default.unlinkSync(file.path);
                }
                console.error(`Error processing file ${file.originalname}:`, error);
            }
        }
        res.status(201).json({
            message: `${uploadedImages.length} images uploaded successfully`,
            images: uploadedImages,
        });
    }
    catch (error) {
        // Clean up all uploaded files if something goes wrong
        const files = req.files;
        files.forEach(file => {
            if (fs_1.default.existsSync(file.path)) {
                fs_1.default.unlinkSync(file.path);
            }
        });
        res.status(500).json({ message: 'Error processing images' });
    }
}));
exports.uploadImages = uploadImages;
// Get user's images
const getUserImages = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const images = yield Image_1.default.find({ userId: req.user._id })
        .sort({ uploadDate: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v');
    const total = yield Image_1.default.countDocuments({ userId: req.user._id });
    res.status(200).json({
        images,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
}));
exports.getUserImages = getUserImages;
// Get single image
const getImage = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const image = yield Image_1.default.findById(req.params.id).select('-__v');
    if (!image) {
        res.status(404).json({ message: 'Image not found' });
        return;
    }
    // Check if user has permission to view this image
    if (!image.isPublic && (!req.user || req.user._id !== image.userId)) {
        res.status(403).json({ message: 'Access denied' });
        return;
    }
    res.status(200).json(image);
}));
exports.getImage = getImage;
// Update image metadata
const updateImage = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    const image = yield Image_1.default.findById(req.params.id);
    if (!image) {
        res.status(404).json({ message: 'Image not found' });
        return;
    }
    // Check if user owns this image
    if (image.userId !== req.user._id) {
        res.status(403).json({ message: 'Access denied' });
        return;
    }
    // Update fields
    if (req.body.description !== undefined) {
        image.description = req.body.description;
    }
    if (req.body.options !== undefined) {
        image.options = req.body.options;
    }
    if (req.body.isPublic !== undefined) {
        image.isPublic = req.body.isPublic;
    }
    yield image.save();
    res.status(200).json({
        message: 'Image updated successfully',
        image: {
            id: image._id,
            description: image.description,
            options: image.options,
            isPublic: image.isPublic,
        },
    });
}));
exports.updateImage = updateImage;
// Delete image
const deleteImage = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    const image = yield Image_1.default.findById(req.params.id);
    if (!image) {
        res.status(404).json({ message: 'Image not found' });
        return;
    }
    // Check if user owns this image
    if (image.userId !== req.user._id) {
        res.status(403).json({ message: 'Access denied' });
        return;
    }
    try {
        // Delete files from filesystem
        const imagePath = path_1.default.join(uploadMiddleware_1.uploadsDir, image.filename);
        const thumbnailPath = path_1.default.join(uploadMiddleware_1.thumbnailsDir, 'thumb_' + image.filename);
        if (fs_1.default.existsSync(imagePath)) {
            fs_1.default.unlinkSync(imagePath);
        }
        if (fs_1.default.existsSync(thumbnailPath)) {
            fs_1.default.unlinkSync(thumbnailPath);
        }
        // Delete from database
        yield Image_1.default.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Image deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting image' });
    }
}));
exports.deleteImage = deleteImage;
// Get public images
const getPublicImages = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const images = yield Image_1.default.find({ isPublic: true })
        .sort({ uploadDate: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .populate('userId', 'name');
    const total = yield Image_1.default.countDocuments({ isPublic: true });
    res.status(200).json({
        images,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
}));
exports.getPublicImages = getPublicImages;
// Search images by options
const searchImages = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    const { query, optionType, optionValue } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let searchCriteria = { userId: req.user._id };
    if (query) {
        searchCriteria.$or = [
            { description: { $regex: query, $options: 'i' } },
            { originalName: { $regex: query, $options: 'i' } },
        ];
    }
    if (optionType) {
        searchCriteria['options.type'] = optionType;
    }
    if (optionValue) {
        searchCriteria['options.value'] = { $regex: optionValue, $options: 'i' };
    }
    const images = yield Image_1.default.find(searchCriteria)
        .sort({ uploadDate: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v');
    const total = yield Image_1.default.countDocuments(searchCriteria);
    res.status(200).json({
        images,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
}));
exports.searchImages = searchImages;
// Get images by option type and value
const getImagesByOption = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    const { type, value } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchCriteria = {
        userId: req.user._id,
        'options.type': type,
    };
    if (value) {
        searchCriteria['options.value'] = value;
    }
    const images = yield Image_1.default.find(searchCriteria)
        .sort({ uploadDate: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v');
    const total = yield Image_1.default.countDocuments(searchCriteria);
    res.status(200).json({
        images,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
}));
exports.getImagesByOption = getImagesByOption;
