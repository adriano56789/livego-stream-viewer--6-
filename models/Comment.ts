import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IComment extends Document {
  content: string;
  user: Types.ObjectId;
  stream?: Types.ObjectId;
  video?: Types.ObjectId;
  parentComment?: Types.ObjectId;
  likes: number;
  isPinned: boolean;
  isDeleted: boolean;
  replies: Types.ObjectId[];
  mentions: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: { type: String, required: true, trim: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stream: { type: Schema.Types.ObjectId, ref: 'Stream' },
    video: { type: Schema.Types.ObjectId, ref: 'Video' },
    parentComment: { type: Schema.Types.ObjectId, ref: 'Comment' },
    likes: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    replies: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
commentSchema.index({ stream: 1, createdAt: -1 });
commentSchema.index({ video: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });

const Comment = mongoose.model<IComment>('Comment', commentSchema);

export default Comment;
