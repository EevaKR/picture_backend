import mongoose, { Document, Schema } from 'mongoose';

export interface IImageOption {
  type: string;
  value: string;
  order: number;
}

export interface IImageMetadata {
  FileName: string;
  Description: string;
  Options: IImageOption[];
}

export interface IImage extends Document {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadDate: Date;
  userId: string;
  description: string;
  options: IImageOption[];
  isPublic: boolean;
  url: string;
  thumbnailUrl?: string;
}

const optionSchema = new Schema({
  type: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
});

const imageSchema = new Schema<IImage>({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  description: {
    type: String,
    default: '',
  },
  options: [optionSchema],
  isPublic: {
    type: Boolean,
    default: false,
  },
  url: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
  },
});

// Index for efficient queries
imageSchema.index({ userId: 1, uploadDate: -1 });
imageSchema.index({ isPublic: 1, uploadDate: -1 });
imageSchema.index({ 'options.type': 1 });
imageSchema.index({ 'options.value': 1 });

const Image = mongoose.model('Image', imageSchema);

export default Image;
