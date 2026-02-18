import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDonation extends Document {
  fromUser: Types.ObjectId;
  toUser: Types.ObjectId;
  stream?: Types.ObjectId;
  amount: number;
  currency: string;
  message?: string;
  isAnonymous: boolean;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId?: string;
  fee: number;
  netAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const donationSchema = new Schema<IDonation>(
  {
    fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stream: { type: Schema.Types.ObjectId, ref: 'Stream' },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'BRL', uppercase: true },
    message: { type: String, maxlength: 500 },
    isAnonymous: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: { type: String, required: true },
    transactionId: { type: String },
    fee: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
donationSchema.index({ fromUser: 1, createdAt: -1 });
donationSchema.index({ toUser: 1, createdAt: -1 });
donationSchema.index({ stream: 1, createdAt: -1 });

// Pre-save hook to calculate net amount
// donationSchema.pre<IDonation>('save', function(next) {
//   this.netAmount = this.amount - this.fee;
//   next();
// });

const Donation = mongoose.model<IDonation>('Donation', donationSchema);

export default Donation;
