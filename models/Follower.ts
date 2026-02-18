import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFollower extends Document {
  user: Types.ObjectId;        // Usuário que está seguindo
  streamer: Types.ObjectId;    // Streamer que está sendo seguido
  isFollowing: boolean;        // Se ainda está seguindo
  notifications: boolean;      // Se deseja receber notificações
  followedAt: Date;            // Quando começou a seguir
  lastNotified?: Date;         // Última notificação enviada
}

const followerSchema = new Schema<IFollower>(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    streamer: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    isFollowing: { 
      type: Boolean, 
      default: true,
      index: true 
    },
    notifications: { 
      type: Boolean, 
      default: true 
    },
    lastNotified: { 
      type: Date 
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Garante que um usuário só pode seguir outro uma única vez
followerSchema.index({ user: 1, streamer: 1 }, { unique: true });

// Índice para consultas de seguidores de um streamer
followerSchema.index({ streamer: 1, isFollowing: 1 });

// Índice para consultas de quem um usuário está seguindo
followerSchema.index({ user: 1, isFollowing: 1 });

// Middleware para garantir que um usuário não possa seguir a si mesmo
followerSchema.pre<IFollower>('save', async function() {
  if (this.user.equals(this.streamer)) {
    throw new Error('Um usuário não pode seguir a si mesmo');
  }
});

const Follower = mongoose.model<IFollower>('Follower', followerSchema);

export default Follower;
