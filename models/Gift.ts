import mongoose, { Document } from 'mongoose';

export interface IGift extends Document {
  name: string;
  description: string;
  image: string;
  value: number;
  animation: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const giftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, required: true },
  value: { type: Number, required: true, min: 1 },
  animation: { type: String },
  category: { type: String, default: 'default' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.model<IGift>('Gift', giftSchema);
