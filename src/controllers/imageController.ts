import { Request, Response } from 'express';
import Image, { IImageMetadata } from '../models/Image';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { uploadsDir, thumbnailsDir } from '../middleware/uploadMiddleware';
import asyncHandler from 'express-async-handler';

// Upload multiple images with metadata
const uploadImages = asyncHandler(async (req: Request, res: Response) => {
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
    let metadata: IImageMetadata[] = [];
    if (req.body.metadata) {
      try {
        metadata = JSON.parse(req.body.metadata);
      } catch (error) {
        res.status(400).json({ message: 'Invalid metadata format' });
        return;
      }
    }

    const uploadedImages = [];
    const files = req.files as Express.Multer.File[];

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
        const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
        
        await sharp(file.path)
          .resize(200, 200, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);

        // Create image record in database
        const image = await Image.create({
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

      } catch (error) {
        // Clean up uploaded file if processing fails
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        console.error(`Error processing file ${file.originalname}:`, error);
      }
    }

    res.status(201).json({
      message: `${uploadedImages.length} images uploaded successfully`,
      images: uploadedImages,
    });

  } catch (error) {
    // Clean up all uploaded files if something goes wrong
    const files = req.files as Express.Multer.File[];
    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
    res.status(500).json({ message: 'Error processing images' });
  }
});

// Get user's images
const getUserImages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const images = await Image.find({ userId: req.user._id })
    .sort({ uploadDate: -1 })
    .skip(skip)
    .limit(limit)
    .select('-__v');

  const total = await Image.countDocuments({ userId: req.user._id });

  res.status(200).json({
    images,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Get single image
const getImage = asyncHandler(async (req: Request, res: Response) => {
  const image = await Image.findById(req.params.id).select('-__v');

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
});

// Update image metadata
const updateImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  const image = await Image.findById(req.params.id);

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

  await image.save();

  res.status(200).json({
    message: 'Image updated successfully',
    image: {
      id: image._id,
      description: image.description,
      options: image.options,
      isPublic: image.isPublic,
    },
  });
});

// Delete image
const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  const image = await Image.findById(req.params.id);

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
    const imagePath = path.join(uploadsDir, image.filename);
    const thumbnailPath = path.join(thumbnailsDir, 'thumb_' + image.filename);

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }

    // Delete from database
    await Image.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting image' });
  }
});

// Get public images
const getPublicImages = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const images = await Image.find({ isPublic: true })
    .sort({ uploadDate: -1 })
    .skip(skip)
    .limit(limit)
    .select('-__v')
    .populate('userId', 'name');

  const total = await Image.countDocuments({ isPublic: true });

  res.status(200).json({
    images,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Search images by options
const searchImages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  const { query, optionType, optionValue } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  let searchCriteria: any = { userId: req.user._id };

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

  const images = await Image.find(searchCriteria)
    .sort({ uploadDate: -1 })
    .skip(skip)
    .limit(limit)
    .select('-__v');

  const total = await Image.countDocuments(searchCriteria);

  res.status(200).json({
    images,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Get images by option type and value
const getImagesByOption = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  const { type, value } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const searchCriteria: any = {
    userId: req.user._id,
    'options.type': type,
  };

  if (value) {
    searchCriteria['options.value'] = value;
  }

  const images = await Image.find(searchCriteria)
    .sort({ uploadDate: -1 })
    .skip(skip)
    .limit(limit)
    .select('-__v');

  const total = await Image.countDocuments(searchCriteria);

  res.status(200).json({
    images,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export {
  uploadImages,
  getUserImages,
  getImage,
  updateImage,
  deleteImage,
  getPublicImages,
  searchImages,
  getImagesByOption,
};
