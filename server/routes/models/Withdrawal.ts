import mongoose, { Document, Schema, Types } from 'mongoose';

type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected' | 'failed';
type PaymentMethod = 'bank_transfer' | 'pix' | 'paypal' | 'crypto' | 'other';

export interface IWithdrawal extends Document {
  user: Types.ObjectId;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  status: WithdrawalStatus;
  paymentMethod: PaymentMethod;
  paymentDetails: {
    accountNumber?: string;
    accountHolderName?: string;
    bankName?: string;
    bankCode?: string;
    branchNumber?: string;
    pixKey?: string;
    pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
    paypalEmail?: string;
    walletAddress?: string;
    network?: string;
    // Outros campos específicos do método de pagamento
    [key: string]: any;
  };
  rejectionReason?: string;
  processedAt?: Date;
  processedBy?: Types.ObjectId;
  metadata: Record<string, any>;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalSchema = new Schema<IWithdrawal>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    fee: {
      type: Number,
      required: true,
      min: 0
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0.01
    },
    currency: {
      type: String,
      required: true,
      default: 'BRL',
      uppercase: true,
      trim: true,
      length: 3
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected', 'failed'],
      default: 'pending',
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'pix', 'paypal', 'crypto', 'other'],
      required: true
    },
    paymentDetails: {
      type: Schema.Types.Mixed,
      required: true,
      default: {}
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500
    },
    processedAt: {
      type: Date,
      index: true
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices para consultas comuns
withdrawalSchema.index({ user: 1, status: 1 });
withdrawalSchema.index({ status: 1, createdAt: 1 });
withdrawalSchema.index({ 'paymentDetails.pixKey': 1 });
withdrawalSchema.index({ createdAt: -1 });

// Middleware para calcular o valor líquido antes de salvar
withdrawalSchema.pre('save', function(next) {
  // Garantir que o valor líquido seja calculado corretamente
  if (this.isModified('amount') || this.isModified('fee')) {
    this.netAmount = Math.max(0, this.amount - this.fee);
  }
  
  // Atualizar a data de processamento quando o status mudar para concluído
  if (this.isModified('status') && this.status === 'completed' && !this.processedAt) {
    this.processedAt = new Date();
  }
});

// Método para aprovar um saque
withdrawalSchema.methods.approve = function(processedBy: Types.ObjectId, metadata: Record<string, any> = {}) {
  if (this.status !== 'pending') {
    throw new Error('Apenas saques pendentes podem ser aprovados');
  }
  
  this.status = 'processing';
  this.processedBy = processedBy;
  this.metadata = { ...this.metadata, ...metadata, approvedAt: new Date() };
  
  return this.save();
};

// Método para marcar como concluído
withdrawalSchema.methods.complete = function(metadata: Record<string, any> = {}) {
  if (this.status !== 'processing') {
    throw new Error('Apenas saques em processamento podem ser concluídos');
  }
  
  this.status = 'completed';
  this.processedAt = new Date();
  this.metadata = { 
    ...this.metadata, 
    ...metadata, 
    completedAt: new Date() 
  };
  
  return this.save();
};

// Método para rejeitar um saque
withdrawalSchema.methods.reject = function(
  reason: string, 
  processedBy: Types.ObjectId, 
  metadata: Record<string, any> = {}
) {
  if (!['pending', 'processing'].includes(this.status)) {
    throw new Error('Apenas saques pendentes ou em processamento podem ser rejeitados');
  }
  
  this.status = 'rejected';
  this.rejectionReason = reason;
  this.processedBy = processedBy;
  this.processedAt = new Date();
  this.metadata = { 
    ...this.metadata, 
    ...metadata, 
    rejectedAt: new Date() 
  };
  
  return this.save();
};

// Método estático para obter estatísticas de saques
withdrawalSchema.statics.getStats = async function(
  userId?: Types.ObjectId,
  startDate?: Date,
  endDate?: Date
) {
  const match: any = {};
  
  if (userId) {
    match.user = userId;
  }
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = startDate;
    if (endDate) match.createdAt.$lte = endDate;
  }
  
  const [
    totalWithdrawals,
    totalAmount,
    totalFees,
    pendingCount,
    processingCount,
    completedCount,
    rejectedCount,
    failedCount,
    byMonth,
    byPaymentMethod
  ] = await Promise.all([
    this.countDocuments(match),
    this.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    this.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$fee' } } }
    ]),
    this.countDocuments({ ...match, status: 'pending' }),
    this.countDocuments({ ...match, status: 'processing' }),
    this.countDocuments({ ...match, status: 'completed' }),
    this.countDocuments({ ...match, status: 'rejected' }),
    this.countDocuments({ ...match, status: 'failed' }),
    this.aggregate([
      {
        $match: {
          ...match,
          createdAt: { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
          fees: { $sum: '$fee' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),
    this.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
          fees: { $sum: '$fee' }
        }
      },
      { $sort: { count: -1 } }
    ])
  ]);
  
  return {
    totalWithdrawals,
    totalAmount: totalAmount[0]?.total || 0,
    totalFees: totalFees[0]?.total || 0,
    totalNetAmount: (totalAmount[0]?.total || 0) - (totalFees[0]?.total || 0),
    byStatus: {
      pending: pendingCount,
      processing: processingCount,
      completed: completedCount,
      rejected: rejectedCount,
      failed: failedCount
    },
    byMonth: byMonth.reduce((acc: any, item: any) => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      acc[key] = {
        count: item.count,
        amount: item.amount,
        fees: item.fees,
        netAmount: item.amount - item.fees
      };
      return acc;
    }, {}),
    byPaymentMethod: byPaymentMethod.reduce((acc: any, item: any) => {
      acc[item._id] = {
        count: item.count,
        amount: item.amount,
        fees: item.fees,
        netAmount: item.amount - item.fees
      };
      return acc;
    }, {})
  };
};

// Método estático para verificar o limite de saque
withdrawalSchema.statics.checkWithdrawalLimit = async function(
  userId: Types.ObjectId,
  amount: number,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
) {
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay()); // Domingo da semana atual
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }
  
  const result = await this.aggregate([
    {
      $match: {
        user: userId,
        status: { $in: ['pending', 'processing', 'completed'] },
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const totalAmount = result[0]?.totalAmount || 0;
  const totalCount = result[0]?.count || 0;
  
  // Obter limites do usuário (aqui você pode implementar lógica personalizada)
  const limits = {
    daily: { maxAmount: 5000, maxCount: 3 },
    weekly: { maxAmount: 15000, maxCount: 5 },
    monthly: { maxAmount: 50000, maxCount: 10 }
  };
  
  const periodLimit = limits[period];
  
  return {
    canWithdraw: 
      totalAmount + amount <= periodLimit.maxAmount && 
      totalCount < periodLimit.maxCount,
    currentAmount: totalAmount,
    currentCount: totalCount,
    remainingAmount: Math.max(0, periodLimit.maxAmount - totalAmount),
    remainingCount: Math.max(0, periodLimit.maxCount - totalCount),
    limit: periodLimit
  };
};

const Withdrawal = mongoose.model<IWithdrawal>('Withdrawal', withdrawalSchema);

export default Withdrawal;
