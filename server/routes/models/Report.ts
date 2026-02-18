import mongoose, { Document, Schema, Types } from 'mongoose';

type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'rejected' | 'invalid';
type ReportType = 'stream' | 'user' | 'comment' | 'message' | 'profile' | 'other';
type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface IReport extends Document {
  reporter: Types.ObjectId;
  reportedItem: {
    type: ReportType;
    id: Types.ObjectId;
  };
  reason: string;
  description?: string;
  status: ReportStatus;
  severity: ReportSeverity;
  assignee?: Types.ObjectId;
  notes: Array<{
    content: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
  }>;
  metadata: Record<string, any>;
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;
  resolution?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reportedItem: {
      type: {
        type: String,
        enum: ['stream', 'user', 'comment', 'message', 'profile', 'other'],
        required: true
      },
      id: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'reportedItem.type'
      }
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'resolved', 'rejected', 'invalid'],
      default: 'pending',
      index: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    notes: [{
      content: {
        type: String,
        required: true,
        trim: true
      },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    resolvedAt: {
      type: Date,
      index: true
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    resolution: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices para consultas comuns
reportSchema.index({ 'reportedItem.type': 1, 'reportedItem.id': 1 });
reportSchema.index({ status: 1, severity: -1 });
reportSchema.index({ reporter: 1, 'reportedItem.id': 1 }, { unique: true });
reportSchema.index({ createdAt: -1 });

// Middleware para atualizar timestamps de status
reportSchema.pre('save', function() {
  if (this.isModified('status') && ['resolved', 'rejected', 'invalid'].includes(this.status) && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
});

// Método para adicionar uma nota ao relatório
reportSchema.methods.addNote = function(content: string, userId: Types.ObjectId) {
  this.notes.push({
    content,
    createdBy: userId,
    createdAt: new Date()
  });
  
  return this.save();
};

// Método para atribuir o relatório a um moderador
reportSchema.methods.assignTo = function(userId: Types.ObjectId, assignedBy: Types.ObjectId) {
  this.assignee = userId;
  this.status = 'under_review';
  
  this.addNote(`Relatório atribuído ao moderador ID: ${userId}`, assignedBy);
  
  return this.save();
};

// Método para resolver o relatório
reportSchema.methods.resolve = function(
  resolution: string,
  resolvedBy: Types.ObjectId,
  status: 'resolved' | 'rejected' | 'invalid' = 'resolved'
) {
  this.status = status;
  this.resolution = resolution;
  this.resolvedBy = resolvedBy;
  this.resolvedAt = new Date();
  
  this.addNote(`Relatório marcado como ${status}. Resolução: ${resolution}`, resolvedBy);
  
  return this.save();
};

// Método para reabrir um relatório resolvido
reportSchema.methods.reopen = function(userId: Types.ObjectId, reason: string) {
  if (this.status === 'pending' || this.status === 'under_review') {
    throw new Error('O relatório já está aberto');
  }
  
  this.status = 'under_review';
  this.resolvedAt = undefined;
  this.resolvedBy = undefined;
  this.resolution = undefined;
  
  this.addNote(`Relatório reaberto. Motivo: ${reason}`, userId);
  
  return this.save();
};

// Método estático para obter estatísticas de relatórios
reportSchema.statics.getStats = async function() {
  const [
    totalReports,
    pendingCount,
    underReviewCount,
    resolvedCount,
    rejectedCount,
    invalidCount,
    byType,
    bySeverity
  ] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ status: 'pending' }),
    this.countDocuments({ status: 'under_review' }),
    this.countDocuments({ status: 'resolved' }),
    this.countDocuments({ status: 'rejected' }),
    this.countDocuments({ status: 'invalid' }),
    this.aggregate([
      { $group: { _id: '$reportedItem.type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    this.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);
  
  return {
    total: totalReports,
    byStatus: {
      pending: pendingCount,
      underReview: underReviewCount,
      resolved: resolvedCount,
      rejected: rejectedCount,
      invalid: invalidCount
    },
    byType: byType.reduce((acc: Record<string, number>, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    bySeverity: bySeverity.reduce((acc: Record<string, number>, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
};

const Report = mongoose.model<IReport>('Report', reportSchema);

export default Report;
