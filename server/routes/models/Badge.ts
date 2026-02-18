import mongoose, { Document, Schema, Types, Model, Callback, HydratedDocument } from 'mongoose';
import { IUser } from './User';
import type { IUserBadge } from './UserBadge';
import UserBadge from './UserBadge';

type BadgeType = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'custom';
type BadgeCategory = 'engagement' | 'achievement' | 'milestone' | 'moderation' | 'content' | 'social' | 'other';
type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface IBadgeCriteria {
  type: string;
  condition: any;
  requiredValue: number;
  progressField?: string;
  description: string;
}

// Add method signatures to the interface
export interface IBadge extends Document {
  name: string;
  description: string;
  type: BadgeType;
  category: BadgeCategory;
  rarity: BadgeRarity;
  icon: string;
  iconType?: 'image' | 'svg' | 'emoji' | 'icon';
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  points: number;
  isActive: boolean;
  isSecret: boolean;
  isStackable: boolean;
  maxProgress?: number;
  criteria: IBadgeCriteria[];
  requiredBadges?: Types.ObjectId[];
  level?: number;
  maxLevel?: number;
  xpReward: number;
  metadata: Record<string, any>;
  unlockMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}

const badgeCriteriaSchema = new Schema<IBadgeCriteria>({
  type: { 
    type: String, 
    required: true,
    trim: true
  },
  condition: {
    type: Schema.Types.Mixed,
    required: true
  },
  requiredValue: {
    type: Number,
    required: true,
    min: 1
  },
  progressField: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const badgeSchema = new Schema<IBadge>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      index: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    type: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'custom'],
      default: 'bronze',
      index: true
    },
    category: {
      type: String,
      enum: ['engagement', 'achievement', 'milestone', 'moderation', 'content', 'social', 'other'],
      default: 'achievement',
      index: true
    },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'],
      default: 'common',
      index: true
    },
    icon: {
      type: String,
      required: true,
      trim: true
    },
    iconType: {
      type: String,
      enum: ['image', 'svg', 'emoji', 'icon'],
      default: 'icon'
    },
    color: {
      type: String,
      trim: true,
      default: '#000000'
    },
    backgroundColor: {
      type: String,
      trim: true,
      default: '#FFFFFF'
    },
    borderColor: {
      type: String,
      trim: true
    },
    points: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isSecret: {
      type: Boolean,
      default: false
    },
    isStackable: {
      type: Boolean,
      default: false
    },
    maxProgress: {
      type: Number,
      min: 1
    },
    criteria: [badgeCriteriaSchema],
    requiredBadges: [{
      type: Schema.Types.ObjectId,
      ref: 'Badge'
    }],
    level: {
      type: Number,
      min: 1,
      default: 1
    },
    maxLevel: {
      type: Number,
      min: 1
    },
    xpReward: {
      type: Number,
      default: 0,
      min: 0
    },
    unlockMessage: {
      type: String,
      trim: true,
      maxlength: 200
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices para consultas comuns
badgeSchema.index({ name: 'text', description: 'text' });
badgeSchema.index({ type: 1, category: 1, rarity: 1 });
badgeSchema.index({ points: -1 });
badgeSchema.index({ isActive: 1, isSecret: 1 });

// Middleware para garantir que o nível não exceda o nível máximo
badgeSchema.pre('save', function(this: any, next: (err?: Error) => void) {
  try {
    if (this.maxLevel && this.level && this.level > this.maxLevel) {
      return next(new Error(`O nível do emblema não pode ser maior que ${this.maxLevel}`));
    }
    
    // Se for um emblema de nível, garantir que maxLevel esteja definido
    if (this.level && this.level > 1 && !this.maxLevel) {
      return next(new Error('Emblemas de nível devem ter um nível máximo definido'));
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Método para verificar se um usuário atende aos critérios do emblema
interface IUserDocument extends IUser {
  _id: Types.ObjectId;
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
  createdAt: Date;
}

badgeSchema.methods.checkCriteria = async function(userId: Types.ObjectId): Promise<{ meets: boolean; progress: number; criteriaMet: boolean[] }> {
  const UserBadge = mongoose.model('UserBadge');
  const User = mongoose.model('User');
  
  // Verificar se o usuário já possui o emblema (se não for empilhável)
  if (!this.isStackable) {
    const existingBadge = await UserBadge.findOne({
      user: userId,
      badge: this._id,
      level: this.level
    });
    
    if (existingBadge) {
      return {
        meets: true,
        progress: 1,
        criteriaMet: this.criteria.map(() => true)
      };
    }
  }
  
  // Verificar emblemas necessários
  if (this.requiredBadges && this.requiredBadges.length > 0) {
    const requiredBadgesCount = await UserBadge.countDocuments({
      user: userId,
      badge: { $in: this.requiredBadges },
      isUnlocked: true
    });
    
    if (requiredBadgesCount < this.requiredBadges.length) {
      return {
        meets: false,
        progress: 0,
        criteriaMet: this.criteria.map(() => false)
      };
    }
  }
  
  // Verificar critérios personalizados
  const user = await User.findById(userId).lean<IUserDocument>();
  if (!user) {
    throw new Error('Usuário não encontrado');
  }
  
  let allCriteriaMet = true;
  const criteriaMet: boolean[] = [];
  let totalProgress = 0;
  
  for (const criterion of this.criteria) {
    let meetsCriterion = false;
    let progress = 0;
    
    // Verificar critérios comuns
    switch (criterion.type) {
      case 'account_age':
        const createdAt = user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt);
        const accountAgeDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        meetsCriterion = accountAgeDays >= criterion.requiredValue;
        progress = Math.min(1, accountAgeDays / criterion.requiredValue);
        break;
        
      case 'follower_count':
        const followers = Array.isArray(user.followers) ? user.followers : [];
        meetsCriterion = followers.length >= criterion.requiredValue;
        progress = Math.min(1, followers.length / criterion.requiredValue);
        break;
        
      case 'following_count':
        const following = Array.isArray(user.following) ? user.following : [];
        meetsCriterion = following.length >= criterion.requiredValue;
        progress = Math.min(1, following.length / criterion.requiredValue);
        break;
        
      case 'post_count':
        // Implementar lógica para contar posts
        break;
        
      case 'like_count':
        // Implementar lógica para contar curtidas recebidas
        break;
        
      case 'comment_count':
        // Implementar lógica para contar comentários
        break;
        
      case 'streak_days':
        // Implementar lógica para verificar sequência de dias
        break;
        
      case 'custom_field':
        // Implementar lógica para campos personalizados
        break;
        
      default:
        // Verificar critérios personalizados
        if (criterion.progressField) {
          const fieldValue = this.getNestedValue(user, criterion.progressField) || 0;
          meetsCriterion = fieldValue >= criterion.requiredValue;
          progress = Math.min(1, fieldValue / criterion.requiredValue);
        }
    }
    
    criteriaMet.push(meetsCriterion);
    totalProgress += progress;
    
    if (!meetsCriterion) {
      allCriteriaMet = false;
    }
  }
  
  // Calcular progresso médio
  const averageProgress = this.criteria.length > 0 ? totalProgress / this.criteria.length : 0;
  
  return {
    meets: allCriteriaMet,
    progress: Math.min(1, averageProgress), // Garantir que o progresso não ultrapasse 1 (100%)
    criteriaMet
  };
};

// Método auxiliar para obter valores aninhados de objetos
badgeSchema.methods.getNestedValue = function(obj: any, path: string) {
  return path.split('.').reduce((o, p) => o?.[p], obj);
};

// Método para conceder o emblema a um usuário
badgeSchema.methods.awardToUser = async function(userId: Types.ObjectId, awardedBy?: Types.ObjectId) {
  const UserBadge = mongoose.model('UserBadge');
  
  // Verificar se o emblema pode ser concedido várias vezes
  if (!this.isStackable) {
    const existingBadge = await UserBadge.findOne({
      user: userId,
      badge: this._id,
      level: this.level
    });
    
    if (existingBadge) {
      return existingBadge;
    }
  }
  
  // Criar novo registro de emblema do usuário
  const userBadge = new UserBadge({
    user: userId,
    badge: this._id,
    level: this.level,
    awardedBy: awardedBy || userId,
    xpEarned: this.xpReward,
    metadata: {
      awardedAt: new Date(),
      ...(awardedBy && { awardedBy })
    }
  }) as HydratedDocument<IUserBadge>;
  
  try {
    await userBadge.save();
  } catch (err) {
    console.error('Error saving user badge:', err);
    throw err;
  }
  
  // Atualizar contagem de pontos do usuário se aplicável
  if (this.points > 0) {
    const User = mongoose.model('User');
    await User.updateOne(
      { _id: userId },
      { $inc: { 'profile.points': this.points } }
    );
  }
  
  // Disparar evento de notificação
  // ...
  
  return userBadge;
};

// Método para obter o próximo nível do emblema (se aplicável)
badgeSchema.methods.getNextLevel = async function() {
  if (!this.maxLevel || !this.level || this.level >= this.maxLevel) {
    return null;
  }
  
  return mongoose.model('Badge').findOne({
    name: this.name,
    level: this.level + 1
  });
};

// Método para obter o emblema anterior (nível inferior)
badgeSchema.methods.getPreviousLevel = async function() {
  if (!this.level || this.level <= 1) {
    return null;
  }
  
  return mongoose.model('Badge').findOne({
    name: this.name,
    level: this.level - 1
  });
};

// Método para obter a lista de usuários que possuem este emblema
badgeSchema.methods.getRecipients = async function(
  page: number = 1,
  limit: number = 50,
  sort: any = { awardedAt: -1 }
) {
  const UserBadge = mongoose.model('UserBadge');
  
  return UserBadge.aggregate([
    { $match: { badge: this._id, isUnlocked: true } },
    { $sort: sort },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        'user.password': 0,
        'user.tokens': 0,
        'user.__v': 0
      }
    }
  ]);
};

// Método para obter estatísticas do emblema
badgeSchema.methods.getStats = async function() {
  const UserBadge = mongoose.model('UserBadge');
  
  const [totalRecipients, firstRecipient, lastRecipients] = await Promise.all([
    UserBadge.countDocuments({ badge: this._id, isUnlocked: true }),
    UserBadge.findOne({ badge: this._id, isUnlocked: true })
      .sort({ awardedAt: 1 })
      .populate('user', 'username avatar displayName'),
    UserBadge.find({ badge: this._id, isUnlocked: true })
      .sort({ awardedAt: -1 })
      .limit(5)
      .populate('user', 'username avatar displayName')
  ]);
  
  return {
    totalRecipients,
    firstRecipient,
    lastRecipients,
    rarityPercentage: await this.calculateRarityPercentage()
  };
};

// Método para calcular a raridade do emblema
badgeSchema.methods.calculateRarityPercentage = async function() {
  const User = mongoose.model('User');
  const UserBadge = mongoose.model('UserBadge');
  
  const [totalUsers, badgeRecipients] = await Promise.all([
    User.countDocuments(),
    UserBadge.countDocuments({ badge: this._id, isUnlocked: true })
  ]);
  
  if (totalUsers === 0) return 0;
  
  const percentage = (badgeRecipients / totalUsers) * 100;
  
  // Retornar a porcentagem com 2 casas decimais
  return Math.round(percentage * 100) / 100;
};

// Add interface for the model methods
interface IBadgeModel extends Model<IBadge> {
  checkCriteria(userId: Types.ObjectId): Promise<{ meets: boolean; progress: number; criteriaMet: boolean[] }>;
  getNestedValue(obj: any, path: string): any;
  awardToUser(userId: Types.ObjectId, awardedBy?: Types.ObjectId): Promise<void>;
  getNextLevel(): Promise<IBadge | null>;
  getPreviousLevel(): Promise<IBadge | null>;
  getRecipients(page?: number, limit?: number, sort?: any): Promise<any>;
  getStats(): Promise<any>;
  calculateRarityPercentage(): Promise<number>;
}

const Badge = mongoose.model<IBadge, IBadgeModel>('Badge', badgeSchema);

export default Badge;
