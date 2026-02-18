import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
  thumbnail: string;
  streamCount: number;
  viewers: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    slug: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    thumbnail: { type: String, default: '' },
    streamCount: { type: Number, default: 0 },
    viewers: { type: Number, default: 0 },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
categorySchema.index({ name: 'text', description: 'text' });

const Category = mongoose.model<ICategory>('Category', categorySchema);

export default Category;
