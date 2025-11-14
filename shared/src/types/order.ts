export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  totalAmount: number;
  tax?: number;
  shippingFee?: number;
  discount?: number;
  paymentMethod?: string;
  paymentStatus: PaymentStatus;
  shippingAddress?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateOrderDto {
  customerId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress?: string;
  notes?: string;
  paymentMethod?: string;
}

export interface UpdateOrderDto {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingAddress?: string;
  notes?: string;
}
