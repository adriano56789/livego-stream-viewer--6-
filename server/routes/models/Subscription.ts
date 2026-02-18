import mongoose, { Document, Schema, Types } from 'mongoose';

type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'past_due' | 'unpaid' | 'trial';
type BillingCycle = 'day' | 'week' | 'month' | 'year';

export interface ISubscription extends Document {
  user: Types.ObjectId;
  plan: Types.ObjectId;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  billingCycle: BillingCycle;
  billingCycleCount: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentMethodId?: string;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  autoRenew: boolean;
  metadata: Record<string, any>;
  history: Array<{
    status: SubscriptionStatus;
    date: Date;
    description?: string;
    metadata?: Record<string, any>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionHistorySchema = new Schema({
  status: {
    type: String,
    required: true,
    enum: ['active', 'canceled', 'expired', 'past_due', 'unpaid', 'trial']
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const subscriptionSchema = new Schema<ISubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'expired', 'past_due', 'unpaid', 'trial'],
      default: 'active',
      index: true
    },
    startDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    endDate: {
      type: Date,
      index: true
    },
    trialStart: {
      type: Date
    },
    trialEnd: {
      type: Date
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    canceledAt: {
      type: Date
    },
    currentPeriodStart: {
      type: Date,
      required: true,
      default: Date.now
    },
    currentPeriodEnd: {
      type: Date,
      required: true
    },
    billingCycle: {
      type: String,
      enum: ['day', 'week', 'month', 'year'],
      default: 'month'
    },
    billingCycleCount: {
      type: Number,
      default: 1,
      min: 1
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'BRL',
      uppercase: true,
      trim: true
    },
    paymentMethod: {
      type: String,
      required: true
    },
    paymentMethodId: {
      type: String
    },
    lastPaymentDate: {
      type: Date
    },
    nextPaymentDate: {
      type: Date,
      index: true
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    history: [subscriptionHistorySchema]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ plan: 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });
subscriptionSchema.index({ nextPaymentDate: 1 });

// Middleware para adicionar entrada no histórico quando o status mudar
subscriptionSchema.pre('save', function(next) {
  const subscription = this as ISubscription;
  
  if (this.isModified('status')) {
    if (!this.history) {
      this.history = [];
    }
    
    this.history.push({
      status: this.status,
      date: new Date(),
      description: `Status alterado para ${this.status}`
    });
  }
});

// Método para cancelar a assinatura
subscriptionSchema.methods.cancel = function(atPeriodEnd: boolean = false) {
  if (this.status === 'canceled') {
    return this;
  }
  
  this.cancelAtPeriodEnd = atPeriodEnd;
  this.canceledAt = new Date();
  
  if (!atPeriodEnd) {
    this.status = 'canceled';
    this.endDate = new Date();
  }
  
  return this.save();
};

// Método para reativar uma assinatura cancelada
subscriptionSchema.methods.reactivate = function() {
  if (this.status !== 'canceled' && !this.cancelAtPeriodEnd) {
    return this;
  }
  
  this.cancelAtPeriodEnd = false;
  this.status = 'active';
  
  // Se a data de término já passou, estender a assinatura
  if (this.endDate && this.endDate < new Date()) {
    const now = new Date();
    this.startDate = now;
    this.currentPeriodStart = now;
    
    // Calcular nova data de término com base no ciclo de cobrança
    const periodEnd = new Date(now);
    const cycleCount = this.billingCycleCount || 1;
    
    switch (this.billingCycle) {
      case 'day':
        periodEnd.setDate(periodEnd.getDate() + cycleCount);
        break;
      case 'week':
        periodEnd.setDate(periodEnd.getDate() + (7 * cycleCount));
        break;
      case 'year':
        periodEnd.setFullYear(periodEnd.getFullYear() + cycleCount);
        break;
      case 'month':
      default:
        periodEnd.setMonth(periodEnd.getMonth() + cycleCount);
        break;
    }
    
    this.currentPeriodEnd = periodEnd;
    this.endDate = undefined;
  }
  
  return this.save();
};

// Método para verificar se a assinatura está ativa
subscriptionSchema.methods.isActive = function(): boolean {
  const now = new Date();
  
  // Verifica se a assinatura está ativa e não expirou
  if (this.status === 'active' || this.status === 'trial') {
    if (this.endDate && this.endDate < now) {
      return false; // Assinatura expirada
    }
    return true;
  }
  
  return false;
};

// Método para adicionar tempo à assinatura
subscriptionSchema.methods.addTime = function(
  amount: number,
  unit: 'days' | 'weeks' | 'months' | 'years'
) {
  if (amount <= 0) {
    throw new Error('O valor deve ser maior que zero');
  }
  
  const now = new Date();
  let newEndDate = this.endDate || now;
  
  // Se a assinatura já expirou, começar a contar de agora
  if (this.endDate && this.endDate < now) {
    newEndDate = now;
  }
  
  // Adicionar o tempo especificado
  switch (unit) {
    case 'days':
      newEndDate.setDate(newEndDate.getDate() + amount);
      break;
    case 'weeks':
      newEndDate.setDate(newEndDate.getDate() + (amount * 7));
      break;
    case 'months':
      newEndDate.setMonth(newEndDate.getMonth() + amount);
      break;
    case 'years':
      newEndDate.setFullYear(newEndDate.getFullYear() + amount);
      break;
  }
  
  this.endDate = newEndDate;
  
  // Se a assinatura estava cancelada, reativá-la
  if (this.status === 'canceled' || this.cancelAtPeriodEnd) {
    this.status = 'active';
    this.cancelAtPeriodEnd = false;
    this.canceledAt = undefined;
  }
  
  return this.save();
};

const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);

export default Subscription;
