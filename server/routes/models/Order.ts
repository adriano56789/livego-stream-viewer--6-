import mongoose, { Document, Schema, Types, SaveOptions as MongooseSaveOptions } from 'mongoose';

type SaveOptions = MongooseSaveOptions & { session?: any };

type OrderStatus = 
  | 'pending_payment' 
  | 'processing' 
  | 'on_hold' 
  | 'completed' 
  | 'cancelled' 
  | 'refunded' 
  | 'failed' 
  | 'trash';

type PaymentMethod = 'credit_card' | 'pix' | 'boleto' | 'paypal' | 'stripe' | 'wallet' | 'other';
type ShippingMethod = 'digital' | 'standard' | 'express' | 'pickup' | 'local_pickup';

export interface IOrderAddress {
  type: 'billing' | 'shipping';
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email: string;
  taxId?: string; // CPF/CNPJ
  isDefault?: boolean;
}

export interface IOrderItem {
  product: Types.ObjectId;
  variantId?: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  subtotal: number;
  tax: number;
  total: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: 'cm' | 'in' | 'm' | 'mm';
  };
  downloadUrl?: string;
  downloadExpires?: Date;
  downloadLimit?: number;
  downloadCount: number;
  metadata: Record<string, any>;
}

export interface IOrderTax {
  name: string;
  rate: number;
  amount: number;
  isInclusive: boolean;
}

export interface IOrderFee {
  name: string;
  amount: number;
  tax: number;
  total: number;
  type: 'fixed' | 'percent';
  taxable: boolean;
}

export interface IOrderShippingLine {
  method: string;
  methodId: string;
  total: number;
  tax: number;
  taxClass?: string;
  deliveryDays?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingCompany?: string;
  metadata: Record<string, any>;
}

export interface IOrderRefund {
  amount: number;
  reason: string;
  note?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  refundedAt: Date;
  paymentTransactionId?: string;
  items: Array<{
    orderItemId: Types.ObjectId;
    quantity: number;
    amount: number;
    reason?: string;
  }>;
  metadata: Record<string, any>;
}

export interface IOrderNote {
  content: string;
  isCustomerNote: boolean;
  isPrivate: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

export interface IOrder extends Document {
  orderNumber: string;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  totalPaid: number;
  totalRefunded: number;
  totalTax: number;
  totalDiscount: number;
  totalItems: number;
  totalItemsQuantity: number;
  paymentMethod: PaymentMethod;
  paymentMethodTitle: string;
  paymentTransactionId?: string;
  paymentUrl?: string;
  paymentInstructions?: string;
  paidAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId;
  cancellationReason?: string;
  ipAddress?: string;
  userAgent?: string;
  customerNote?: string;
  createdVia: string;
  version: string;
  cartHash?: string;
  cartTax: number;
  shippingTax: number;
  
  // Relacionamentos
  customer: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  
  // Itens do pedido
  items: IOrderItem[];
  
  // Taxas
  taxLines: IOrderTax[];
  feeLines: IOrderFee[];
  
  // Endereços
  addresses: IOrderAddress[];
  
  // Envio
  shippingLines: IOrderShippingLine[];
  
  // Reembolsos
  refunds: IOrderRefund[];
  
  // Notas
  notes: IOrderNote[];
  
  // Cupons
  couponLines: Array<{
    code: string;
    discount: number;
    discountTax: number;
    originalDiscount: number;
    couponId?: Types.ObjectId;
  }>;
  
  // Metadados
  metadata: Record<string, any>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  datePaid?: Date;
  dateCompleted?: Date;
  
  // Métodos
  calculateTotals(): void;
}

// Schemas
const orderAddressSchema = new Schema<IOrderAddress>({
  type: { type: String, required: true, enum: ['billing', 'shipping'] },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  company: { type: String, trim: true },
  address1: { type: String, required: true, trim: true },
  address2: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  taxId: { type: String, trim: true },
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const orderItemSchema = new Schema<IOrderItem>({
  product: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  variantId: { type: String },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1,
    default: 1 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  subtotal: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  tax: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  total: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  weight: { 
    type: Number, 
    min: 0 
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    unit: { 
      type: String, 
      enum: ['cm', 'in', 'm', 'mm'],
      default: 'cm'
    }
  },
  downloadUrl: { type: String },
  downloadExpires: { type: Date },
  downloadLimit: { type: Number, min: 0 },
  downloadCount: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, { _id: true });

const orderTaxSchema = new Schema<IOrderTax>({
  name: { type: String, required: true },
  rate: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
  isInclusive: { type: Boolean, default: false }
}, { _id: false });

const orderFeeSchema = new Schema<IOrderFee>({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  tax: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['fixed', 'percent'],
    default: 'fixed' 
  },
  taxable: { type: Boolean, default: false }
}, { _id: false });

const orderShippingLineSchema = new Schema<IOrderShippingLine>({
  method: { type: String, required: true },
  methodId: { type: String, required: true },
  total: { type: Number, required: true, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  taxClass: { type: String },
  deliveryDays: { type: String },
  trackingNumber: { type: String },
  trackingUrl: { type: String },
  shippingCompany: { type: String },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const orderRefundSchema = new Schema<IOrderRefund>({
  amount: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true },
  note: { type: String },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  createdAt: { type: Date, default: Date.now },
  refundedAt: { type: Date, default: Date.now },
  paymentTransactionId: { type: String },
  items: [{
    orderItemId: { 
      type: Schema.Types.ObjectId, 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    amount: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    reason: { type: String }
  }],
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, { _id: true });

const orderNoteSchema = new Schema<IOrderNote>({
  content: { 
    type: String, 
    required: true,
    trim: true 
  },
  isCustomerNote: { 
    type: Boolean, 
    default: false 
  },
  isPrivate: { 
    type: Boolean, 
    default: false 
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: true });

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true
    },
    status: {
      type: String,
      enum: [
        'pending_payment',
        'processing',
        'on_hold',
        'completed',
        'cancelled',
        'refunded',
        'failed',
        'trash'
      ],
      default: 'pending_payment',
      index: true
    },
    currency: {
      type: String,
      default: 'BRL',
      uppercase: true,
      trim: true
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    shippingTotal: {
      type: Number,
      default: 0,
      min: 0
    },
    taxTotal: {
      type: Number,
      default: 0,
      min: 0
    },
    discountTotal: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: 0
    },
    totalRefunded: {
      type: Number,
      default: 0,
      min: 0
    },
    totalTax: {
      type: Number,
      default: 0,
      min: 0
    },
    totalDiscount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalItems: {
      type: Number,
      default: 0,
      min: 0
    },
    totalItemsQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'pix', 'boleto', 'paypal', 'stripe', 'wallet', 'other'],
      required: true
    },
    paymentMethodTitle: {
      type: String,
      trim: true
    },
    paymentTransactionId: {
      type: String,
      index: true
    },
    paymentUrl: {
      type: String
    },
    paymentInstructions: {
      type: String,
      trim: true
    },
    paidAt: {
      type: Date,
      index: true
    },
    completedAt: {
      type: Date,
      index: true
    },
    cancelledAt: {
      type: Date,
      index: true
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    cancellationReason: {
      type: String,
      trim: true
    },
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    customerNote: {
      type: String,
      trim: true
    },
    createdVia: {
      type: String,
      default: 'web',
      trim: true
    },
    version: {
      type: String,
      default: '1.0.0',
      trim: true
    },
    cartHash: {
      type: String,
      index: true
    },
    cartTax: {
      type: Number,
      default: 0,
      min: 0
    },
    shippingTax: {
      type: Number,
      default: 0,
      min: 0
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    items: [orderItemSchema],
    taxLines: [orderTaxSchema],
    feeLines: [orderFeeSchema],
    addresses: [orderAddressSchema],
    shippingLines: [orderShippingLineSchema],
    refunds: [orderRefundSchema],
    notes: [orderNoteSchema],
    couponLines: [{
      code: { type: String, required: true },
      discount: { type: Number, required: true, min: 0 },
      discountTax: { type: Number, default: 0, min: 0 },
      originalDiscount: { type: Number, required: true, min: 0 },
      couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' }
    }],
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    datePaid: {
      type: Date,
      index: true
    },
    dateCompleted: {
      type: Date,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices para consultas comuns
orderSchema.index({ customer: 1, status: 1 });
orderSchema.index({ 'items.product': 1 });
orderSchema.index({ 'addresses.email': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ total: 1 });
orderSchema.index({ 'paymentTransactionId': 1 }, { sparse: true });

// Middleware para gerar número do pedido
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Gerar número do pedido no formato ORD-YYYYMMDD-XXXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Order.countDocuments({
      createdAt: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      }
    });
    
    this.orderNumber = `ORD-${dateStr}-${(count + 1).toString().padStart(5, '0')}`;
    
    // Calcular totais
    this.calculateTotals();
  }
});

// Método para calcular totais
orderSchema.methods.calculateTotals = function() {
  // Calcular subtotal dos itens
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calcular total de itens e quantidades
  this.totalItems = this.items.length;
  this.totalItemsQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calcular totais de taxas
  this.taxTotal = this.taxLines.reduce((sum, tax) => sum + tax.amount, 0);
  
  // Calcular totais de taxas de envio
  this.shippingTax = this.shippingLines.reduce((sum, line) => sum + (line.tax || 0), 0);
  
  // Calcular totais de taxas adicionais
  this.taxTotal += this.feeLines
    .filter(fee => fee.taxable)
    .reduce((sum, fee) => sum + (fee.tax || 0), 0);
  
  // Calcular total de descontos
  const couponDiscount = this.couponLines.reduce((sum, coupon) => sum + coupon.discount, 0);
  this.totalDiscount = this.discountTotal + couponDiscount;
  
  // Calcular total
  this.total = this.subtotal + this.shippingTotal + this.taxTotal - this.totalDiscount;
  
  // Garantir que o total não seja negativo
  this.total = Math.max(0, this.total);
  
  return this;
};

// Método para adicionar um item ao pedido
orderSchema.methods.addItem = function(itemData: Partial<IOrderItem>) {
  const newItem: IOrderItem = {
    product: itemData.product!,
    variantId: itemData.variantId,
    name: itemData.name || '',
    sku: itemData.sku || `SKU-${Date.now()}`,
    quantity: itemData.quantity || 1,
    price: itemData.price || 0,
    subtotal: (itemData.price || 0) * (itemData.quantity || 1),
    tax: itemData.tax || 0,
    total: ((itemData.price || 0) * (itemData.quantity || 1)) + (itemData.tax || 0),
    weight: itemData.weight,
    dimensions: itemData.dimensions,
    downloadUrl: itemData.downloadUrl,
    downloadExpires: itemData.downloadExpires,
    downloadLimit: itemData.downloadLimit,
    downloadCount: 0,
    metadata: itemData.metadata || {}
  };
  
  this.items.push(newItem);
  
  // Recalcular totais
  this.calculateTotals();
  
  return this.save();
};

// Método para atualizar o status do pedido
orderSchema.methods.updateStatus = async function(
  newStatus: OrderStatus, 
  userId: Types.ObjectId,
  note?: string
) {
  const previousStatus = this.status;
  this.status = newStatus;
  
  // Atualizar timestamps com base no status
  const now = new Date();
  
  switch (newStatus) {
    case 'completed':
      this.completedAt = now;
      this.dateCompleted = now;
      break;
    case 'cancelled':
      this.cancelledAt = now;
      this.cancelledBy = userId;
      break;
    case 'processing':
      if (previousStatus === 'pending_payment' && !this.paidAt) {
        this.paidAt = now;
        this.datePaid = now;
      }
      break;
  }
  
  // Adicionar nota de status
  if (note) {
    this.notes.push({
      content: `Status alterado de ${previousStatus} para ${newStatus}: ${note}`,
      isCustomerNote: false,
      isPrivate: true,
      createdBy: userId,
      createdAt: now
    });
  }
  
  await this.save();
  
  // Disparar eventos ou notificações aqui
  
  return this;
};

// Método para adicionar um reembolso
orderSchema.methods.addRefund = async function(
  amount: number,
  reason: string,
  userId: Types.ObjectId,
  items: Array<{
    orderItemId: Types.ObjectId;
    quantity: number;
    amount: number;
    reason?: string;
  }> = [],
  note?: string
) {
  if (amount <= 0) {
    throw new Error('O valor do reembolso deve ser maior que zero');
  }
  
  if (amount > (this.total - this.totalRefunded)) {
    throw new Error('O valor do reembolso não pode ser maior que o valor restante do pedido');
  }
  
  const refund: IOrderRefund = {
    amount,
    reason,
    note,
    createdBy: userId,
    createdAt: new Date(),
    refundedAt: new Date(),
    items,
    metadata: {}
  };
  
  this.refunds.push(refund);
  this.totalRefunded += amount;
  
  // Atualizar status se todo o valor foi reembolsado
  if (this.totalRefunded >= this.total) {
    this.status = 'refunded';
  }
  
  // Adicionar nota de reembolso
  this.notes.push({
    content: `Reembolso de ${amount} ${this.currency} processado. Motivo: ${reason}`,
    isCustomerNote: false,
    isPrivate: true,
    createdBy: userId,
    createdAt: new Date()
  });
  
  await this.save();
  
  // Disparar eventos ou notificações aqui
  
  return this;
};

// Método para adicionar uma nota ao pedido
orderSchema.methods.addNote = function(
  content: string, 
  userId: Types.ObjectId, 
  isCustomerNote: boolean = false,
  isPrivate: boolean = true
) {
  this.notes.push({
    content,
    isCustomerNote,
    isPrivate,
    createdBy: userId,
    createdAt: new Date()
  });
  
  return this.save();
};

// Método para processar o pagamento
orderSchema.methods.processPayment = async function(
  paymentData: {
    transactionId: string;
    paymentMethod: PaymentMethod;
    paymentMethodTitle?: string;
    amount?: number;
    metadata?: Record<string, any>;
  }
) {
  if (this.status !== 'pending_payment') {
    throw new Error('O pedido não está aguardando pagamento');
  }
  
  const now = new Date();
  const amount = paymentData.amount || this.total;
  
  // Atualizar informações de pagamento
  this.paymentTransactionId = paymentData.transactionId;
  this.paymentMethod = paymentData.paymentMethod;
  this.paymentMethodTitle = paymentData.paymentMethodTitle || paymentData.paymentMethod;
  this.paidAt = now;
  this.datePaid = now;
  this.totalPaid = amount;
  
  // Atualizar status com base no valor pago
  if (amount >= this.total) {
    this.status = 'processing';
  } else {
    this.status = 'on_hold';
  }
  
  // Adicionar metadados de pagamento
  this.metadata = {
    ...this.metadata,
    payment: {
      ...(this.metadata?.payment || {}),
      ...paymentData.metadata,
      processedAt: now,
      ipAddress: this.ipAddress
    }
  };
  
  // Adicionar nota de pagamento
  this.notes.push({
    content: `Pagamento de ${amount} ${this.currency} processado via ${this.paymentMethodTitle} (${paymentData.transactionId})`,
    isCustomerNote: false,
    isPrivate: true,
    createdBy: this.updatedBy,
    createdAt: now
  });
  
  await this.save();
  
  // Disparar eventos ou notificações aqui
  
  return this;
};

const Order = mongoose.model<IOrder>('Order', orderSchema);

export default Order;
