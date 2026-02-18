import mongoose, { Document } from 'mongoose';

export enum TransactionType {
  DIAMOND_PURCHASE = 'diamond_purchase',
  GIFT_SENT = 'gift_sent',
  GIFT_RECEIVED = 'gift_received',
  WITHDRAWAL = 'withdrawal',
  REFERRAL_BONUS = 'referral_bonus',
  OTHER = 'other'
}

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  description: string;
  referenceId?: string;
  metadata?: any;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: Object.values(TransactionType), 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  referenceId: { 
    type: String 
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'pending' 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries on user and type
transactionSchema.index({ user: 1, type: 1 });

export default mongoose.model<ITransaction>('Transaction', transactionSchema);
