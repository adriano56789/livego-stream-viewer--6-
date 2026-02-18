import mongoose, { Document, Schema, Types } from 'mongoose';

type ProductStatus = 'draft' | 'active' | 'out_of_stock' | 'discontinued';
type ProductType = 'physical' | 'digital' | 'service' | 'subscription';

export interface IProductVariant {
  _id: any;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  costPerItem?: number;
  barcode?: string;
  inventory: {
    quantity: number;
    trackInventory: boolean;
    allowPurchaseOutOfStock: boolean;
  };
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in' | 'm' | 'mm';
  };
  images: string[];
  isDefault: boolean;
}

export interface IProductImage {
  url: string;
  altText?: string;
  isMain: boolean;
  position: number;
}

export interface IProductCategory {
  category: Types.ObjectId;
  isPrimary: boolean;
}

export interface IProductTag {
  name: string;
  slug: string;
}

export interface IProductSeo {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  noIndex: boolean;
  noFollow: boolean;
  structuredData?: Record<string, any>;
}

export interface IProduct extends Document {
  title: string;
  description: string;
  slug: string;
  status: ProductStatus;
  type: ProductType;
  vendor?: string;
  brand?: string;
  tags: IProductTag[];
  categories: IProductCategory[];
  variants: IProductVariant[];
  images: IProductImage[];
  seo: IProductSeo;
  isFeatured: boolean;
  isGiftCard: boolean;
  requiresShipping: boolean;
  isTaxable: boolean;
  taxCode?: string;
  taxExempt: boolean;
  hasVariants: boolean;
  options: Array<{
    name: string;
    values: string[];
  }>;
  metadata: Record<string, any>;
  viewCount: number;
  salesCount: number;
  rating: {
    average: number;
    count: number;
  };
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}

const productVariantSchema = new Schema<IProductVariant>({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, trim: true, uppercase: true },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  costPerItem: { type: Number, min: 0 },
  barcode: { type: String, trim: true },
  inventory: {
    quantity: { type: Number, default: 0, min: 0 },
    trackInventory: { type: Boolean, default: false },
    allowPurchaseOutOfStock: { type: Boolean, default: false }
  },
  weight: { type: Number, min: 0 },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    unit: { type: String, enum: ['cm', 'in', 'm', 'mm'], default: 'cm' }
  },
  images: [{ type: String }],
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const productImageSchema = new Schema<IProductImage>({
  url: { type: String, required: true },
  altText: { type: String, trim: true },
  isMain: { type: Boolean, default: false },
  position: { type: Number, default: 0, min: 0 }
}, { _id: false });

const productCategorySchema = new Schema<IProductCategory>({
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  isPrimary: { type: Boolean, default: false }
}, { _id: false });

const productTagSchema = new Schema<IProductTag>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true }
}, { _id: false });

const productSeoSchema = new Schema<IProductSeo>({
  title: { type: String, trim: true, maxlength: 70 },
  description: { type: String, trim: true, maxlength: 320 },
  keywords: [{ type: String, trim: true }],
  canonicalUrl: { type: String, trim: true },
  noIndex: { type: Boolean, default: false },
  noFollow: { type: Boolean, default: false },
  structuredData: { type: Schema.Types.Mixed }
}, { _id: false });

const productSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    description: {
      type: String,
      trim: true,
      maxlength: 10000
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'out_of_stock', 'discontinued'],
      default: 'draft',
      index: true
    },
    type: {
      type: String,
      enum: ['physical', 'digital', 'service', 'subscription'],
      default: 'physical',
      index: true
    },
    vendor: {
      type: String,
      trim: true
    },
    brand: {
      type: String,
      trim: true
    },
    tags: [productTagSchema],
    categories: [productCategorySchema],
    variants: [productVariantSchema],
    images: [productImageSchema],
    seo: {
      type: productSeoSchema,
      default: () => ({})
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    isGiftCard: {
      type: Boolean,
      default: false
    },
    requiresShipping: {
      type: Boolean,
      default: true
    },
    isTaxable: {
      type: Boolean,
      default: true
    },
    taxCode: {
      type: String,
      trim: true
    },
    taxExempt: {
      type: Boolean,
      default: false
    },
    hasVariants: {
      type: Boolean,
      default: false
    },
    options: [{
      name: { type: String, required: true, trim: true },
      values: [{ type: String, trim: true }]
    }],
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    salesCount: {
      type: Number,
      default: 0,
      min: 0
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 }
    },
    publishedAt: {
      type: Date
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

// Indexes
productSchema.index({ title: 'text', description: 'text', 'tags.name': 'text' });
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ status: 1, type: 1 });
productSchema.index({ 'categories.category': 1 });
productSchema.index({ 'variants.sku': 1 }, { sparse: true });
productSchema.index({ 'variants.barcode': 1 }, { sparse: true });
productSchema.index({ viewCount: -1 });
productSchema.index({ salesCount: -1 });
productSchema.index({ 'rating.average': -1 });

// Middleware para atualizar o status baseado no estoque
productSchema.pre('save', function(next) {
  const product = this as IProduct;
  
  // Se o produto tem variantes, verifica o estoque total
  if (product.variants && product.variants.length > 0) {
    const totalStock = product.variants.reduce((sum, variant) => {
      return sum + (variant.inventory?.quantity || 0);
    }, 0);
    
    if (totalStock <= 0 && product.status === 'active') {
      product.status = 'out_of_stock';
    } else if (totalStock > 0 && product.status === 'out_of_stock') {
      product.status = 'active';
    }
  }
  
  // Se for publicado, definir a data de publicação
  if (product.isModified('status') && product.status === 'active' && !product.publishedAt) {
    product.publishedAt = new Date();
  }
});

// Método para verificar a disponibilidade de estoque
productSchema.methods.checkStock = function(variantId?: string, quantity: number = 1): boolean {
  if (this.hasVariants && variantId) {
    const variant = this.variants.find((v: any) => v._id.toString() === variantId);
    if (!variant) return false;
    
    if (variant.inventory.trackInventory && !variant.inventory.allowPurchaseOutOfStock) {
      return variant.inventory.quantity >= quantity;
    }
    return true;
  }
  
  // Para produtos sem variantes
  if (!this.hasVariants && this.variants[0]) {
    const variant = this.variants[0];
    if (variant.inventory.trackInventory && !variant.inventory.allowPurchaseOutOfStock) {
      return variant.inventory.quantity >= quantity;
    }
    return true;
  }
  
  return false;
};

// Método para reduzir o estoque
productSchema.methods.decreaseStock = async function(variantId: string, quantity: number = 1) {
  if (!this.hasVariants) {
    variantId = this.variants[0]?._id.toString();
  }
  
  const variant = this.variants.id(variantId);
  if (!variant) {
    throw new Error('Variante não encontrada');
  }
  
  if (variant.inventory.trackInventory) {
    if (variant.inventory.quantity < quantity && !variant.inventory.allowPurchaseOutOfStock) {
      throw new Error('Estoque insuficiente');
    }
    variant.inventory.quantity = Math.max(0, variant.inventory.quantity - quantity);
  }
  
  // Atualizar contadores
  this.salesCount += quantity;
  
  await this.save();
  return this;
};

// Método para aumentar o estoque
productSchema.methods.increaseStock = async function(variantId: string, quantity: number = 1) {
  if (!this.hasVariants) {
    variantId = this.variants[0]?._id.toString();
  }
  
  const variant = this.variants.id(variantId);
  if (!variant) {
    throw new Error('Variante não encontrada');
  }
  
  if (variant.inventory.trackInventory) {
    variant.inventory.quantity += quantity;
  }
  
  await this.save();
  return this;
};

// Método para adicionar uma nova variante
productSchema.methods.addVariant = function(variantData: Partial<IProductVariant>) {
  if (!this.hasVariants && this.variants.length > 0) {
    throw new Error('Este produto não suporta múltiplas variantes');
  }
  
  const newVariant: IProductVariant = {
    name: variantData.name || 'Padrão',
    sku: variantData.sku || `SKU-${Date.now()}`,
    price: variantData.price || 0,
    compareAtPrice: variantData.compareAtPrice,
    costPerItem: variantData.costPerItem,
    barcode: variantData.barcode,
    inventory: {
      quantity: variantData.inventory?.quantity || 0,
      trackInventory: variantData.inventory?.trackInventory || false,
      allowPurchaseOutOfStock: variantData.inventory?.allowPurchaseOutOfStock || false
    },
    weight: variantData.weight,
    dimensions: variantData.dimensions,
    images: variantData.images || [],
    isDefault: variantData.isDefault || false,
    _id: undefined
  };
  
  this.variants.push(newVariant);
  
  // Se for a primeira variante, definir como padrão
  if (this.variants.length === 1) {
    this.variants[0].isDefault = true;
  }
  
  // Se esta variante for definida como padrão, remover a marcação das outras
  if (newVariant.isDefault) {
    this.variants.forEach((v: any) => {
      if (v._id !== newVariant._id) {
        v.isDefault = false;
      }
    });
  }
  
  return this.save();
};

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;
