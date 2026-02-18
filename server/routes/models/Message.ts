import mongoose, { Document, Schema, Types } from 'mongoose';

type SaveOptions = mongoose.SaveOptions;

export interface IMessage extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  readBy: Types.ObjectId[];
  isEdited: boolean;
  attachments: string[];
  replyTo?: Types.ObjectId;
  reactions: {
    userId: Types.ObjectId;
    emoji: string;
  }[];
  deletedFor: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        type: String,
      },
    ],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    reactions: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        emoji: {
          type: String,
          required: true,
        },
      },
    ],
    deletedFor: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ 'reactions.userId': 1 });
messageSchema.index({ sender: 1, createdAt: -1 });

// Virtual for message URL
messageSchema.virtual('url').get(function (this: IMessage) {
  return `/messages/${this._id}`;
});

// Pre-save hook to handle message content
messageSchema.pre('save', async function() {
  const message = this as IMessage;
  if (message.isModified('content')) {
    message.content = message.content.trim();
  }
});

const Message = mongoose.model<IMessage>('Message', messageSchema);

export default Message;
