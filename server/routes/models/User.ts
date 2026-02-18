import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Add method signatures to the interface
export interface IUser extends Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar: string;
  level: number;
  xp: number;
  diamonds: number;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  blockedUsers: mongoose.Types.ObjectId[];
  notifications: any[];
  lastSeen: Date;
  isOnline: boolean;
  settings: {
    notifications: any;
    privacy: any;
    chat: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  diamonds: { type: Number, default: 0 },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  notifications: [{
    type: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  lastSeen: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  settings: {
    notifications: { type: Object, default: {} },
    privacy: { type: Object, default: {} },
    chat: { type: Object, default: {} }
  }
}, {
  timestamps: true
});

// Add methods to schema
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function(): string {
  const token = jwt.sign(
    { userId: this._id },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1d' }
  );
  return token;
};

export default mongoose.model<IUser>('User', userSchema);
