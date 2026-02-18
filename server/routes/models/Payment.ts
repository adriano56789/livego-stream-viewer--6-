import mongoose, { Document, Schema, Types } from 'mongoose';

type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'disputed' | 'cancelled';
type PaymentMethod = 'credit_card' | 'pix' | 'boleto' | 'paypal' | 'stripe' | 'other';
type PaymentType = 'subscription' | 'donation' | 'purchase' | 'withdrawal' | 'refund' | 'payout';

export interface IPayment extends Document {
  user: Types.ObjectId;
  recipient?: Types.ObjectId; // Para quem é o pagamento (streamer, plataforma, etc.)
  amount: number;
  currency: string;
  fee: number;
  netAmount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  description: string;
  metadata: Record<string, any>;
  externalId?: string; // ID do pagamento no gateway de pagamento
  invoiceId?: string;
  dueDate?: Date;
  paidAt?: Date;
  refundedAt?: Date;
  refundReason?: string;
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  relatedItems?: Array<{
    type: 'subscription' | 'donation' | 'product' | 'service';
    itemId: Types.ObjectId;
    quantity: number;
    unitPrice: number;
    description: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      default: 'BRL',
      uppercase: true,
      trim: true,
    },
    fee: {
      type: Number,
      default: 0,
      min: 0,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'disputed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'pix', 'boleto', 'paypal', 'stripe', 'other'],
      required: true,
    },
    paymentType: {
      type: String,
      enum: ['subscription', 'donation', 'purchase', 'withdrawal', 'refund', 'payout'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    externalId: {
      type: String,
      index: true,
      sparse: true,
    },
    invoiceId: {
      type: String,
      index: true,
      sparse: true,
    },
    dueDate: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
    refundReason: {
      type: String,
      trim: true,
    },
    billingDetails: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      address: {
        line1: { type: String, trim: true },
        line2: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        country: { type: String, trim: true },
      },
    },
    relatedItems: [
      {
        type: { type: String, required: true },
        itemId: { type: Schema.Types.ObjectId, required: true },
        quantity: { type: Number, default: 1, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        description: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ recipient: 1, status: 1 });
paymentSchema.index({ status: 1, paymentType: 1 });
paymentSchema.index({ createdAt: -1 });

// Pre-save hook para calcular o valor líquido
paymentSchema.pre<IPayment>('save', function () {
  if (this.isModified('amount') || this.isModified('fee')) {
    this.netAmount = Math.max(0, this.amount - this.fee);
  }
});

// Método para marcar como pago
paymentSchema.methods.markAsPaid = async function (externalId?: string) {
  this.status = 'completed';
  this.paidAt = new Date();
  if (externalId) {
    this.externalId = externalId;
  }
  return await this.save({ validateBeforeSave: true });
};

// Método para reembolsar
paymentSchema.methods.refund = function (reason?: string) {
  if (this.status !== 'completed') {
    throw new Error('Apenas pagamentos completos podem ser reembolsados');
  }
  this.status = 'refunded';
  this.refundedAt = new Date();
  if (reason) {
    this.refundReason = reason;
  }
  return this.save({ validateBeforeSave: true });
};

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;
