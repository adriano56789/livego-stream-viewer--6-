import { Document, Types } from 'mongoose';

export type SaveOptions = Parameters<Document['save']>[0];

export interface BaseDocument extends Document {
  _id: Types.ObjectId;
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
