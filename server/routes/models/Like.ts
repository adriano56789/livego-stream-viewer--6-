import mongoose, { Document, Schema, Types } from 'mongoose';

type LikeTargetType = 'stream' | 'comment' | 'video' | 'post';

export interface ILike extends Document {
  user: Types.ObjectId;
  targetType: LikeTargetType;
  target: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const likeSchema = new Schema<ILike>(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    targetType: { 
      type: String, 
      required: true,
      enum: ['stream', 'comment', 'video', 'post'],
      index: true
    },
    target: { 
      type: Schema.Types.ObjectId, 
      required: true,
      index: true 
    },
    isActive: { 
      type: Boolean, 
      default: true,
      index: true 
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índice composto para garantir que um usuário só possa dar like uma vez em cada conteúdo
likeSchema.index({ user: 1, targetType: 1, target: 1 }, { unique: true });

// Índice para contar likes por conteúdo
likeSchema.index({ targetType: 1, target: 1, isActive: 1 });

// Middleware para atualizar contadores quando um like é criado/removido
likeSchema.post<ILike>('save', async function(doc) {
  await updateLikeCount(doc);
});

likeSchema.post<ILike>('findOneAndUpdate', async function(result) {
  // The result of findOneAndUpdate is the modified document
  if (result) {
    await updateLikeCount(result as unknown as ILike);
  }
});

async function updateLikeCount(like: ILike) {
  const modelMap = {
    'stream': 'Stream',
    'comment': 'Comment',
    'video': 'Video',
    'post': 'Post'
  };

  const modelName = modelMap[like.targetType as keyof typeof modelMap];
  if (!modelName) return;

  const Model = mongoose.model(modelName);
  const count = await Like.countDocuments({ 
    targetType: like.targetType, 
    target: like.target,
    isActive: true 
  });

  await Model.findByIdAndUpdate(like.target, { likes: count });
}

const Like = mongoose.model<ILike>('Like', likeSchema);

export default Like;
