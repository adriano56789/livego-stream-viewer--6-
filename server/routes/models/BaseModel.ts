import { Document, Schema, Model, model } from 'mongoose';

// Interface para o documento base
export interface IBaseDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Opções padrão para os schemas
const schemaOptions = {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
};

// Função para criar um modelo base
export function createModel<T extends IBaseDocument>(
  modelName: string,
  schemaDefinition: Record<string, any>,
  collectionName?: string
): Model<T> {
  const schema = new Schema<T>(
    {
      ...schemaDefinition,
      isActive: { type: Boolean, default: true },
    },
    schemaOptions
  );

  return model<T>(modelName, schema, collectionName);
}

