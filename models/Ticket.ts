import mongoose, { Document, Schema, Types } from 'mongoose';

type TicketStatus = 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed' | 'spam';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
type TicketSource = 'web' | 'email' | 'api' | 'chat' | 'phone' | 'social' | 'other';

export interface ITicketMessage {
  content: string;
  sender: Types.ObjectId;
  isInternalNote: boolean;
  attachments: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;
  metadata: Record<string, any>;
  readBy: Array<{
    userId: Types.ObjectId;
    readAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITicket extends Document {
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  source: TicketSource;
  type: string;
  assignee?: Types.ObjectId;
  requester: Types.ObjectId;
  organization?: Types.ObjectId;
  group?: Types.ObjectId;
  tags: string[];
  customFields: Record<string, any>;
  metadata: Record<string, any>;
  firstResponseTime?: number; // in minutes
  resolutionTime?: number; // in minutes
  satisfactionRating?: number; // 1-5
  satisfactionComment?: string;
  isEscalated: boolean;
  escalatedAt?: Date;
  escalatedBy?: Types.ObjectId;
  escalatedTo?: Types.ObjectId;
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;
  closedAt?: Date;
  closedBy?: Types.ObjectId;
  reopenedAt?: Date;
  reopenedBy?: Types.ObjectId;
  reopenedCount: number;
  messages: ITicketMessage[];
  followers: Types.ObjectId[];
  relatedTickets: Types.ObjectId[];
  updatedBy?: Types.ObjectId; // ID do usuário que atualizou o ticket
  createdAt: Date;
  updatedAt: Date;
}

const ticketMessageSchema = new Schema<ITicketMessage>({
  content: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isInternalNote: {
    type: Boolean,
    default: false
  },
  attachments: [{
    url: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true }
  }],
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  readBy: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  _id: true
});

const ticketSchema = new Schema<ITicket>(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['open', 'pending', 'in_progress', 'resolved', 'closed', 'spam'],
      default: 'open',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true
    },
    source: {
      type: String,
      enum: ['web', 'email', 'api', 'chat', 'phone', 'social', 'other'],
      default: 'web',
      index: true
    },
    type: {
      type: String,
      trim: true,
      index: true
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: 'SupportGroup',
      index: true
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    customFields: {
      type: Schema.Types.Mixed,
      default: {}
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    firstResponseTime: {
      type: Number,
      min: 0
    },
    resolutionTime: {
      type: Number,
      min: 0
    },
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5
    },
    satisfactionComment: {
      type: String,
      trim: true
    },
    isEscalated: {
      type: Boolean,
      default: false,
      index: true
    },
    escalatedAt: {
      type: Date
    },
    escalatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    escalatedTo: {
      type: Schema.Types.ObjectId,
      ref: 'SupportGroup'
    },
    resolvedAt: {
      type: Date,
      index: true
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    closedAt: {
      type: Date,
      index: true
    },
    closedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reopenedAt: {
      type: Date
    },
    reopenedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reopenedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    messages: [ticketMessageSchema],
    followers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    relatedTickets: [{
      type: Schema.Types.ObjectId,
      ref: 'Ticket'
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices para consultas comuns
ticketSchema.index({ subject: 'text', description: 'text', 'messages.content': 'text' });
ticketSchema.index({ requester: 1, status: 1 });
ticketSchema.index({ assignee: 1, status: 1 });
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ 'tags': 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ updatedAt: -1 });

// Middleware para atualizar timestamps de status
ticketSchema.pre('save', async function() {
  const ticket = this as ITicket;
  const now = new Date();
  
  // Se o status foi alterado
  if (this.isModified('status')) {
    switch (this.status) {
      case 'resolved':
        this.resolvedAt = now;
        this.resolvedBy = this.updatedBy;
        break;
      case 'closed':
        this.closedAt = now;
        this.closedBy = this.updatedBy;
        break;
      case 'in_progress':
        // Se estava resolvido/fechado e foi reaberto
        if (this.resolvedAt) {
          this.reopenedAt = now;
          this.reopenedBy = this.updatedBy;
          this.reopenedCount += 1;
          this.resolvedAt = undefined;
          this.resolvedBy = undefined;
          this.closedAt = undefined;
          this.closedBy = undefined;
        }
        break;
    }
  }
  
  // Se o atribuído foi alterado
  if (this.isModified('assignee') && this.assignee) {
    // Se não houver mensagens, adicionar uma nota de atribuição
    if (this.messages.length === 0) {
      const now = new Date();
      this.messages.push({
        content: `Ticket atribuído a ${this.assignee}`,
        sender: this.updatedBy as Types.ObjectId,
        isInternalNote: true,
        attachments: [],
        metadata: {},
        readBy: [],
        createdAt: now,
        updatedAt: now
      });
    }
  }
});

// Método para adicionar uma mensagem ao ticket
ticketSchema.methods.addMessage = function(
  content: string, 
  sender: Types.ObjectId, 
  isInternalNote: boolean = false,
  attachments: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }> = []
) {
  const message: ITicketMessage = {
    content,
    sender,
    isInternalNote,
    attachments,
    metadata: {},
    readBy: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  this.messages.push(message);
  
  // Se for a primeira mensagem, definir como descrição
  if (this.messages.length === 1) {
    this.description = content.substring(0, 500);
  }
  
  // Se for uma resposta do suporte e o status era 'open', mudar para 'in_progress'
  if (!isInternalNote && this.status === 'open' && !this.isNew) {
    this.status = 'in_progress';
  }
  
  // Se for a primeira resposta, calcular o tempo de primeira resposta
  if (!isInternalNote && this.messages.length > 1 && !this.firstResponseTime) {
    const firstResponseTime = Math.floor((new Date().getTime() - this.createdAt.getTime()) / 60000); // em minutos
    this.firstResponseTime = firstResponseTime;
  }
  
  return this.save();
};

// Método para atribuir o ticket
ticketSchema.methods.assign = function(
  assigneeId: Types.ObjectId, 
  userId: Types.ObjectId,
  note?: string
) {
  this.assignee = assigneeId;
  this.updatedBy = userId;
  
  // Adicionar nota de atribuição
  if (note) {
    this.messages.push({
      content: `Atribuído para ${assigneeId}. ${note}`,
      sender: userId,
      isInternalNote: true,
      attachments: [],
      metadata: {},
      readBy: []
    });
  }
  
  return this.save();
};

// Método para atualizar o status
ticketSchema.methods.updateStatus = function(
  status: TicketStatus, 
  userId: Types.ObjectId,
  note?: string
) {
  const previousStatus = this.status;
  this.status = status;
  this.updatedBy = userId;
  
  // Adicionar nota de mudança de status
  const statusNote = `Status alterado de ${previousStatus} para ${status}` + (note ? `: ${note}` : '');
  
  this.messages.push({
    content: statusNote,
    sender: userId,
    isInternalNote: true,
    attachments: [],
    metadata: {},
    readBy: []
  });
  
  return this.save();
};

// Método para adicionar um seguidor
ticketSchema.methods.addFollower = function(userId: Types.ObjectId) {
  if (!this.followers.includes(userId)) {
    this.followers.push(userId);
    return this.save();
  }
  return this;
};

// Método para remover um seguidor
ticketSchema.methods.removeFollower = function(userId: Types.ObjectId) {
  const index = this.followers.indexOf(userId);
  if (index > -1) {
    this.followers.splice(index, 1);
    return this.save();
  }
  return this;
};

// Método para marcar mensagens como lidas
ticketSchema.methods.markAsRead = function(userId: Types.ObjectId) {
  const now = new Date();
  
  // Para cada mensagem, marcar como lida pelo usuário se ainda não estiver
  this.messages.forEach((message: ITicketMessage) => {
    const hasRead = message.readBy.some(entry => 
      entry.userId.toString() === userId.toString()
    );
    
    if (!hasRead) {
      message.readBy.push({
        userId,
        readAt: now
      });
    }
  });
  
  return this.save();
};

// Método para adicionar classificação de satisfação
ticketSchema.methods.addSatisfactionRating = function(
  rating: number, 
  comment?: string,
  userId?: Types.ObjectId
) {
  if (rating < 1 || rating > 5) {
    throw new Error('A classificação deve ser entre 1 e 5');
  }
  
  this.satisfactionRating = rating;
  this.satisfactionComment = comment;
  
  // Adicionar nota de classificação
  if (userId) {
    this.messages.push({
      content: `Classificação de satisfação: ${rating}/5` + (comment ? `\nComentário: ${comment}` : ''),
      sender: userId,
      isInternalNote: true,
      attachments: [],
      metadata: {},
      readBy: []
    });
  }
  
  return this.save();
};

// Método para escalar o ticket
ticketSchema.methods.escalate = function(
  groupId: Types.ObjectId,
  reason: string,
  userId: Types.ObjectId
) {
  this.isEscalated = true;
  this.escalatedAt = new Date();
  this.escalatedBy = userId;
  this.escalatedTo = groupId;
  this.updatedBy = userId;
  
  // Adicionar nota de escalação
  this.messages.push({
    content: `Ticket escalado para o grupo ${groupId}. Motivo: ${reason}`,
    sender: userId,
    isInternalNote: true,
    attachments: [],
    metadata: {},
    readBy: []
  });
  
  return this.save();
};

// Método para mesclar com outro ticket
ticketSchema.methods.merge = async function(
  targetTicketId: Types.ObjectId,
  userId: Types.ObjectId
) {
  const Ticket = mongoose.model<TicketDocument>('Ticket');
  const targetTicket = await Ticket.findById(targetTicketId);
  
  if (!targetTicket) {
    throw new Error('Ticket de destino não encontrado');
  }
  
  // Adicionar referência ao ticket mesclado
  targetTicket.relatedTickets.push(this._id);
  
  // Adicionar nota nos dois tickets
  const mergeNote = `Ticket mesclado com #${targetTicket._id}`;
  const targetMergeNote = `Ticket #${this._id} mesclado neste ticket`;
  
  const now = new Date();
  
  this.messages.push({
    content: mergeNote,
    sender: userId,
    isInternalNote: true,
    attachments: [],
    metadata: {},
    readBy: [],
    createdAt: now,
    updatedAt: now
  });
  
  targetTicket.messages.push({
    content: targetMergeNote,
    sender: userId,
    isInternalNote: true,
    attachments: [],
    metadata: {},
    readBy: [],
    createdAt: now,
    updatedAt: now
  });
  
  // Fechar o ticket atual
  this.status = 'closed';
  this.closedAt = new Date();
  this.closedBy = userId;
  
  await Promise.all([
    this.save(),
    targetTicket.save()
  ]);
  
  return targetTicket;
};

type TicketDocument = ITicket & Document;

const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);

export default Ticket;
