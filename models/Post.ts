import mongoose, { Document, Schema, Types, Model } from 'mongoose';
import Notification, { NotificationType } from './Notification';

interface IUser extends Document {
  name: string;
  // Add other user properties as needed
}

type PostType = 'text' | 'image' | 'video' | 'poll' | 'link' | 'announcement';
type PostVisibility = 'public' | 'followers' | 'subscribers' | 'private';

export interface IPostMedia {
  url: string;
  type: 'image' | 'video' | 'gif';
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number; // Para vídeos
  altText?: string;
}

export interface IPostPollOption {
  id: string;
  text: string;
  votes: number;
  voters: Types.ObjectId[];
}

export interface IPostPoll {
  question: string;
  options: IPostPollOption[];
  isMultiple: boolean;
  endDate?: Date;
  isAnonymous: boolean;
  totalVotes: number;
}

export interface IPost extends Document {
  author: Types.ObjectId;
  content: string;
  type: PostType;
  visibility: PostVisibility;
  media?: IPostMedia[];
  poll?: IPostPoll;
  linkPreview?: {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    domain?: string;
  };
  mentions: Types.ObjectId[];
  hashtags: string[];
  isPinned: boolean;
  isEdited: boolean;
  isSensitive: boolean;
  isCommentable: boolean;
  likeCount: number;
  reactions: {
    [key: string]: {
      count: number;
      users: Types.ObjectId[];
    };
  };
  commentCount: number;
  shareCount: number;
  viewCount: number;
  sharedPost?: Types.ObjectId;
  parentPost?: Types.ObjectId;
  location?: {
    type: string;
    coordinates: [number, number];
    name?: string;
  };
  scheduledAt?: Date;
  publishedAt: Date;
  expiresAt?: Date;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const postMediaSchema = new Schema<IPostMedia>({
  url: { type: String, required: true },
  type: { type: String, required: true, enum: ['image', 'video', 'gif'] },
  thumbnail: { type: String },
  width: { type: Number },
  height: { type: Number },
  duration: { type: Number },
  altText: { type: String }
}, { _id: false });

const postPollOptionSchema = new Schema<IPostPollOption>({
  id: { type: String, required: true },
  text: { type: String, required: true, trim: true },
  votes: { type: Number, default: 0, min: 0 },
  voters: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { _id: false });

const postPollSchema = new Schema<IPostPoll>({
  question: { type: String, required: true, trim: true },
  options: { type: [postPollOptionSchema], required: true, min: 2 },
  isMultiple: { type: Boolean, default: false },
  endDate: { type: Date },
  isAnonymous: { type: Boolean, default: false },
  totalVotes: { type: Number, default: 0, min: 0 }
}, { _id: false });

const postSchema = new Schema<IPost>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    content: {
      type: String,
      trim: true,
      maxlength: 10000
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'poll', 'link', 'announcement'],
      required: true,
      default: 'text'
    },
    visibility: {
      type: String,
      enum: ['public', 'followers', 'subscribers', 'private'],
      default: 'public'
    },
    media: [postMediaSchema],
    poll: postPollSchema,
    linkPreview: {
      url: { type: String },
      title: { type: String },
      description: { type: String },
      image: { type: String },
      domain: { type: String }
    },
    mentions: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    hashtags: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    isPinned: {
      type: Boolean,
      default: false
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    isSensitive: {
      type: Boolean,
      default: false
    },
    reactions: {
      type: Map,
      of: new Schema({
        count: { type: Number, default: 0, min: 0 },
        users: [{ type: Schema.Types.ObjectId, ref: 'User' }]
      }, { _id: false }),
      default: {}
    },
    isCommentable: {
      type: Boolean,
      default: true
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0
    },
    shareCount: {
      type: Number,
      default: 0,
      min: 0
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    sharedPost: {
      type: Schema.Types.ObjectId,
      ref: 'Post'
    },
    parentPost: {
      type: Schema.Types.ObjectId,
      ref: 'Post'
    },
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      name: String
    },
    scheduledAt: {
      type: Date
    },
    publishedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled', 'archived'],
      default: 'published',
      index: true
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

// Indexes
postSchema.index({ author: 1, status: 1 });
postSchema.index({ parentPost: 1 });
postSchema.index({ sharedPost: 1 });
postSchema.index({ 'hashtags': 1 });
postSchema.index({ 'mentions': 1 });
postSchema.index({ publishedAt: -1 });
postSchema.index({ 'location.coordinates': '2dsphere' });
postSchema.index({ content: 'text' });

// Virtual para comentários
postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  justOne: false
});

// Virtual para likes
postSchema.virtual('likes', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'target',
  match: { targetType: 'post' },
  justOne: false
});

// Middleware para processar hashtags e menções
postSchema.pre('save', function(next) {
  const post = this as IPost;
  
  // Extrair hashtags do conteúdo
  if (post.isModified('content')) {
    const hashtagRegex = /#(\w+)/g;
    const matches = post.content?.match(hashtagRegex) || [];
    post.hashtags = [...new Set(matches.map(tag => tag.substring(1).toLowerCase()))];
    
    // Extrair menções
    const mentionRegex = /@(\w+)/g;
    // Nota: As menções reais serão processadas no controlador
  }
  
  // Se for um post agendado, definir status como scheduled
  if (post.scheduledAt && post.scheduledAt > new Date()) {
    post.status = 'scheduled';
  } else if (post.status === 'scheduled' && (!post.scheduledAt || post.scheduledAt <= new Date())) {
    post.status = 'published';
  }
  
  // Se for um post de mídia, definir o tipo automaticamente
  if (post.media && post.media.length > 0 && !post.type) {
    const mediaTypes = new Set(post.media.map(m => m.type));
    if (mediaTypes.has('video')) {
      post.type = 'video';
    } else if (mediaTypes.has('image') || mediaTypes.has('gif')) {
      post.type = 'image';
    }
  }
  
  // Se for um post de enquete, garantir que o tipo esteja correto
  if (post.poll) {
    post.type = 'poll';
  }
});

// Método para adicionar ou atualizar uma reação
postSchema.methods.addReaction = async function(userId: Types.ObjectId, reaction: string) {
  // Normaliza a reação para minúsculas
  const normalizedReaction = reaction.toLowerCase();
  
  // Inicializa o objeto de reações se não existir
  if (!this.reactions) {
    this.reactions = {};
  }
  
  // Verifica se a reação já existe
  if (this.reactions.has(normalizedReaction)) {
    const reactionData = this.reactions.get(normalizedReaction);
    
    // Verifica se o usuário já reagiu com essa reação
    const userIndex = reactionData.users.findIndex(
      (id: Types.ObjectId) => id.toString() === userId.toString()
    );
    
    if (userIndex === -1) {
      // Adiciona o usuário à lista de reações
      reactionData.users.push(userId);
      reactionData.count += 1;
      this.reactions.set(normalizedReaction, reactionData);
    } else {
      // Remove a reação do usuário se já existir (toggle)
      reactionData.users.splice(userIndex, 1);
      reactionData.count -= 1;
      
      // Remove a reação se não houver mais usuários
      if (reactionData.count <= 0) {
        this.reactions.delete(normalizedReaction);
      } else {
        this.reactions.set(normalizedReaction, reactionData);
      }
    }
  } else {
    // Cria uma nova entrada para a reação
    this.reactions.set(normalizedReaction, {
      count: 1,
      users: [userId]
    });
  }
  
  // Salva as alterações
  return this.save();
};

// Método para adicionar um comentário
postSchema.methods.addComment = function(commentData: any) {
  // Incrementar o contador de comentários
  this.commentCount += 1;
  return this.save();
};

// Método para remover um comentário
postSchema.methods.removeComment = function() {
  // Decrementar o contador de comentários (se não for negativo)
  this.commentCount = Math.max(0, this.commentCount - 1);
  return this.save();
};

// Método para verificar se o usuário já curtiu o post
postSchema.methods.didUserLike = async function(userId: Types.ObjectId) {
  const Like = mongoose.model('Like');
  const like = await Like.findOne({
    user: userId,
    target: this._id,
    targetType: 'post'
  });
  return !!like;
};

// Método para agendar postagem
postSchema.methods.schedule = function(publishAt: Date) {
  this.scheduledAt = publishAt;
  this.status = 'scheduled';
  return this.save();
};

// Método para publicar imediatamente
postSchema.methods.publish = function() {
  this.status = 'published';
  this.publishedAt = new Date();
  this.scheduledAt = undefined;
  return this.save();
};

// Método para arquivar o post
postSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Hook pós-salvar para notificar usuários mencionados
postSchema.post('save', async function(doc: IPost) {
  try {
    // Skip if no mentions or if it's an update without new mentions
    if (!doc.mentions || doc.mentions.length === 0) {
      return;
    }

    // Get the author's name for the notification
    const User = mongoose.model<IUser>('User');
    const author = await User.findById(doc.author).select('name').lean();
    if (!author) return;

    // Get the first 50 characters of the post content for the preview
    const contentPreview = doc.content.length > 50 
      ? `${doc.content.substring(0, 47)}...` 
      : doc.content;

    // Create notification for each mentioned user
    const notifications = doc.mentions.map(userId => ({
      user: userId,
      type: NotificationType.MENTION,
      title: 'Você foi mencionado em uma publicação',
      message: `${author.name} te mencionou em uma publicação: "${contentPreview}"`,
      relatedUser: doc.author,
      metadata: {
        postId: doc._id,
        postType: doc.type,
        isComment: !!doc.parentPost
      }
    }));

    // Insert all notifications in a single operation
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error in post-save mention notification:', error);
    // Don't throw error to avoid breaking the save operation
  }
});

const Post = mongoose.model<IPost>('Post', postSchema);

export default Post;
