import mongoose, { Document, Schema, Types, Model, SaveOptions as MongooseSaveOptions } from 'mongoose';
import { baseSchemaOptions, BaseDocument, createSchema, SchemaDefinitionType } from './baseSchema';

type SaveOptions = MongooseSaveOptions;

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface IReviewImage {
  url: string;
  altText?: string;
  position: number;
}

export interface IReviewVideo {
  url: string;
  thumbnail?: string;
  duration?: number;
  position: number;
}

export interface IReviewRating {
  criteria: string;
  value: number; // 1-5
}

export interface IReview {
  content: string | Types.ObjectId; // Can be string or ObjectId for content reference
  rating: number; // 1-5
  ratings?: IReviewRating[];
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  isPublic: boolean;
  isFeatured: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  reportCount: number;
  replyCount: number;
  images: IReviewImage[];
  videos: IReviewVideo[];
  likes: Types.ObjectId[];
  flags: Array<{
    userId: Types.ObjectId;
    reason: string;
    createdAt: Date;
  }>;
  metadata: Record<string, any>;
  
  // Relationships
  user: Types.ObjectId;
  product?: Types.ObjectId;
  stream?: Types.ObjectId;
  contentRef?: Types.ObjectId; // Renamed from content to avoid conflict
  parentReview?: Types.ObjectId;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  verifiedAt?: Date;
}

// Define schema for review images
interface IReviewImageDocument extends IReviewImage, Document {}

const reviewImageSchema = new Schema<IReviewImageDocument>({
  url: { type: String, required: true },
  altText: { type: String, trim: true },
  position: { type: Number, default: 0, min: 0 }
}, { _id: false });

const reviewVideoSchema = new Schema<IReviewVideo>({
  url: { type: String, required: true },
  thumbnail: { type: String },
  duration: { type: Number, min: 0 },
  position: { type: Number, default: 0, min: 0 }
}, { _id: false });

const reviewRatingSchema = new Schema<IReviewRating>({
  criteria: { type: String, required: true, trim: true },
  value: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Avaliação deve ser um número inteiro entre 1 e 5'
    }
  }
}, { _id: false });

const reviewFlagSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  reason: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 500
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false });

// Define document interface that extends IReview and adds methods
export interface IReviewDocument extends IReview, Document {
  // Required by BaseDocument and Mongoose
  _id: Types.ObjectId;
  id: string;
  __v: number;  // Made required by removing the '?'
  toObject(options?: any): any;
  toJSON(options?: any): any;
  
  // Custom methods
  save(saveOptions?: mongoose.SaveOptions): Promise<this>;
  markHelpful(userId: Types.ObjectId, isHelpful?: boolean): Promise<this>;
  report(userId: Types.ObjectId, reason: string): Promise<this>;
  approve(): Promise<this>;
  reject(reason?: string): Promise<this>;
  reply(userId: Types.ObjectId, content: string): Promise<this>;
  calculateAverageRating(): number;
}

// Define model interface with static methods
export interface IReviewModel extends Model<IReviewDocument, {}, {}, {}, IReviewDocument, IReviewModel> {
  findById(id: Types.ObjectId | string): mongoose.Query<IReviewDocument | null, IReviewDocument, {}, IReviewDocument>;
  countDocuments(conditions?: any): mongoose.Query<number, IReviewDocument, {}, IReviewDocument>;
}

// Define the schema with proper generics
// Define the schema using createSchema from baseSchema
const reviewSchema = createSchema<IReviewDocument>(
  {
    content: { 
      type: Schema.Types.Mixed, 
      required: true, 
      set: (val: string | Types.ObjectId) => {
        return val instanceof Types.ObjectId ? val : String(val);
      },
      get: (val: string | Types.ObjectId) => {
        return val instanceof Types.ObjectId ? val.toString() : val;
      }
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Avaliação deve ser um número inteiro entre 1 e 5'
      }
    },
    ratings: [reviewRatingSchema],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending',
      index: true
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0
    },
    unhelpfulCount: {
      type: Number,
      default: 0,
      min: 0
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0
    },
    replyCount: {
      type: Number,
      default: 0,
      min: 0
    },
    images: [reviewImageSchema],
    videos: [reviewVideoSchema],
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    flags: [reviewFlagSchema],
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      index: true
    },
    stream: {
      type: Schema.Types.ObjectId,
      ref: 'Stream',
      index: true
    },
    contentRef: { 
      type: Schema.Types.ObjectId, 
      ref: 'Content',
      index: true 
    },
    parentReview: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      index: true
    },
    publishedAt: {
      type: Date,
      index: true
    },
    verifiedAt: {
      type: Date
    }
  },
  {
    ...baseSchemaOptions
  }
);

// Índices para consultas comuns
reviewSchema.index({ user: 1, status: 1 });
reviewSchema.index({ product: 1, status: 1, rating: 1 });
reviewSchema.index({ stream: 1, status: 1, rating: 1 });
reviewSchema.index({ contentRef: 1, status: 1, rating: 1 });
reviewSchema.index({ rating: 1, status: 1 });
reviewSchema.index({ helpfulCount: -1 });
reviewSchema.index({ createdAt: -1 });

// Garantir que apenas um dos campos de relacionamento esteja preenchido
reviewSchema.pre('validate', async function() {
  const targets = [this.product, this.stream, this.contentRef].filter(Boolean);
  
  if (targets.length !== 1) {
    throw new Error('A avaliação deve estar associada a um produto, stream ou conteúdo');
  }
  
  // Validar formato dos ObjectIds
  const validateObjectId = (id: any) => !id || mongoose.Types.ObjectId.isValid(id);
  if (!validateObjectId(this.user) || 
      (this.product && !validateObjectId(this.product)) ||
      (this.stream && !validateObjectId(this.stream)) ||
      (this.contentRef && !validateObjectId(this.contentRef)) ||
      (this.parentReview && !validateObjectId(this.parentReview))) {
    throw new Error('Formato de ID inválido para um dos campos de referência');
  }
});

// Atualizar a contagem de respostas quando uma resposta for adicionada
reviewSchema.pre('save', async function() {
  if (this.parentReview && this.isNew) {
    this.replyCount = 0; // Respostas não têm contagem de respostas
  }
});

// Atualizar a contagem de respostas no review pai
reviewSchema.post('save', async function(doc) {
  if (doc.parentReview) {
    const Review = mongoose.model<IReviewDocument, IReviewModel>('Review');
    const parent = await Review.findById(doc.parentReview);
    
    if (parent) {
      const replyCount = await Review.countDocuments({ 
        parentReview: parent._id,
        status: 'approved'
      });
      
      if (parent.replyCount !== replyCount) {
        parent.replyCount = replyCount;
        const saveOptions: SaveOptions = { validateBeforeSave: true };
        await parent.save(saveOptions);
      }
    }
  }
});

// Método para marcar como útil/não útil
reviewSchema.methods.markHelpful = async function(this: IReviewDocument, userId: Types.ObjectId, isHelpful: boolean = true): Promise<IReviewDocument> {
  const userStr = userId.toString();
  
  // Verificar se o usuário já marcou
  const likeIndex = this.likes.findIndex(id => id.toString() === userStr);
  
  if (isHelpful) {
    if (likeIndex === -1) {
      this.likes.push(userId);
      this.helpfulCount += 1;
    } else {
      // Se já tiver marcado como não útil, ajustar as contagens
      this.helpfulCount += 1;
      this.unhelpfulCount = Math.max(0, this.unhelpfulCount - 1);
    }
  } else {
    if (likeIndex === -1) {
      this.likes.push(userId);
      this.unhelpfulCount += 1;
    } else {
      // Se já tiver marcado como útil, ajustar as contagens
      this.unhelpfulCount += 1;
      this.helpfulCount = Math.max(0, this.helpfulCount - 1);
    }
  }
  
  const saveOptions: SaveOptions = { validateBeforeSave: true };
  return this.save(saveOptions);
};

// Método para reportar uma avaliação
reviewSchema.methods.report = async function(this: IReviewDocument, userId: Types.ObjectId, reason: string): Promise<IReviewDocument> {
  // Verificar se o usuário já reportou
  const hasReported = this.flags.some(flag => 
    flag.userId.toString() === userId.toString()
  );
  
  if (!hasReported) {
    this.flags.push({
      userId,
      reason,
      createdAt: new Date()
    });
    
    this.reportCount = this.flags.length;
    
    // Se atingir um limite de reports, marcar como sinalizado para revisão
    if (this.reportCount >= 3 && this.status !== 'flagged') {
      this.status = 'flagged';
    }
  }
  
  const saveOptions: SaveOptions = { validateBeforeSave: true };
  return this.save(saveOptions);
};

reviewSchema.methods.approve = async function(this: IReviewDocument): Promise<IReviewDocument> {
  this.status = 'approved';
  this.publishedAt = this.publishedAt || new Date();
  
  if (this.isVerifiedPurchase) {
    this.verifiedAt = new Date();
  }
  
  const saveOptions: SaveOptions = { validateBeforeSave: true };
  return this.save(saveOptions);
};

// Método para rejeitar uma avaliação
reviewSchema.methods.reject = async function(this: IReviewDocument, reason?: string): Promise<IReviewDocument> {
  this.status = 'rejected';
  
  if (reason) {
    if (!this.metadata) {
      this.metadata = {};
    }
    this.metadata.rejectionReason = reason;
  }
  
  const saveOptions: SaveOptions = { validateBeforeSave: true };
  return this.save(saveOptions);
};

// Método para responder a uma avaliação
reviewSchema.methods.reply = async function(this: IReviewDocument, userId: Types.ObjectId, content: string): Promise<IReviewDocument> {
  const Review = mongoose.model<IReviewDocument, IReviewModel>('Review');
  
  const newReview = new Review({
    content,
    user: userId,
    parentReview: this._id,
    status: 'approved', // Ou moderação, dependendo da configuração
    isPublic: true,
    createdBy: userId, // Adicionado para atender ao BaseDocument
    updatedBy: userId, // Adicionado para atender ao BaseDocument
    // Adicionando campos obrigatórios do IReview
    rating: 5, // Valor padrão, ajuste conforme necessário
    isVerifiedPurchase: false,
    helpfulCount: 0,
    unhelpfulCount: 0,
    reportCount: 0,
    replyCount: 0,
    images: [],
    videos: [],
    likes: [],
    flags: [],
    metadata: {}
  });
  
  const saveOptions: SaveOptions = { validateBeforeSave: true };
  return newReview.save(saveOptions);
};

// Método para calcular a classificação média para classificações múltiplas
reviewSchema.methods.calculateAverageRating = function(this: IReviewDocument): number {
  if (!this.ratings || this.ratings.length === 0) {
    return this.rating;
  }
  
  const sum = this.ratings.reduce((acc, curr) => acc + curr.value, 0);
  return parseFloat((sum / this.ratings.length).toFixed(1));
};

// Atualizar a classificação média antes de salvar
reviewSchema.pre<IReviewDocument>('save', async function() {
  // Só prosseguir se ratings foi modificado ou é um novo documento
  if (!this.isModified('ratings') && !this.isNew) return;
  
  // Se não houver ratings, definir como 0 ou manter o existente se for uma atualização
  if (!this.ratings || this.ratings.length === 0) {
    this.rating = this.isNew ? 0 : this.rating;
    return;
  }

  // Validar valores de classificação (1-5)
  const invalidRating = this.ratings.some(r => 
    typeof r.value !== 'number' || r.value < 1 || r.value > 5
  );
  
  if (invalidRating) {
    throw new Error('Os valores de classificação devem estar entre 1 e 5');
  }

  // Calcular e atualizar a média
  this.rating = this.calculateAverageRating();
});

// Add index for better query performance
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ status: 1 });
reviewSchema.index({ rating: 1 });

// Create and export the model
const Review = mongoose.model<IReviewDocument, IReviewModel>('Review', reviewSchema);
export default Review;
