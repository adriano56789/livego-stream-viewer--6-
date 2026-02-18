import mongoose, { Document } from 'mongoose';

export interface IStream extends Document {
  title: string;
  description: string;
  streamer: mongoose.Types.ObjectId;
  isLive: boolean;
  viewers: number;
  thumbnail: string;
  category: string;
  tags: string[];
  startTime: Date;
  endTime?: Date;
  chatEnabled: boolean;
  chatMessages: Array<{
    user: mongoose.Types.ObjectId;
    message: string;
    timestamp: Date;
    isGift: boolean;
    giftDetails?: {
      giftId: string;
      name: string;
      value: number;
      image: string;
    };
  }>;
  viewersHistory: Array<{
    timestamp: Date;
    count: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const streamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  streamer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isLive: { type: Boolean, default: false },
  viewers: { type: Number, default: 0 },
  thumbnail: { type: String, default: '' },
  category: { type: String, required: true },
  tags: [{ type: String }],
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  chatEnabled: { type: Boolean, default: true },
  chatMessages: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isGift: { type: Boolean, default: false },
    giftDetails: {
      giftId: String,
      name: String,
      value: Number,
      image: String
    }
  }],
  viewersHistory: [{
    timestamp: { type: Date, default: Date.now },
    count: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

export default mongoose.model<IStream>('Stream', streamSchema);
