import { Document, Schema, SchemaDefinition, SchemaOptions, Types, Model } from 'mongoose';

// Helper type to flatten nested types
type FlatRecord<T> = T extends object ? { [K in keyof T]: T[K] } : T;

export interface BaseDocument extends Document {
  _id: Types.ObjectId;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
  save(saveOptions?: any): Promise<this>;
  toObject(options?: any): any;
  toJSON(options?: any): any;
  [key: string]: any;
}

type TransformFunction = (doc: any, ret: any, options?: any) => any;

const transform: TransformFunction = (doc, ret) => {
  const { _id, __v, ...rest } = ret;
  return {
    ...rest,
    id: _id ? _id.toString() : _id
  };
};

export const baseSchemaOptions: SchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform
  },
  toObject: {
    virtuals: true,
    transform
  }
};

export type SchemaDefinitionType<T> = {
  [K in keyof T]: T[K] extends Date ? Date : T[K] extends object ? SchemaDefinition<T[K]> : any;
};

export function createSchema<T extends BaseDocument>(
  definition: SchemaDefinition<SchemaDefinitionType<T>>,
  options: SchemaOptions = {}
) {
  return new Schema<T>(
    definition as SchemaDefinition<SchemaDefinitionType<T>>,
    {
      ...baseSchemaOptions,
      ...options,
    } as SchemaOptions<FlatRecord<T>>
  ) as Schema<T, Model<T>, any, any>;
}
