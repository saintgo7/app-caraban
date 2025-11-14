export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  minStockLevel?: number;
  unit: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  costPrice?: number;
  stockQuantity?: number;
  minStockLevel?: number;
  unit: string;
  imageUrl?: string;
}

export interface UpdateProductDto {
  sku?: string;
  name?: string;
  description?: string;
  categoryId?: string;
  price?: number;
  costPrice?: number;
  stockQuantity?: number;
  minStockLevel?: number;
  unit?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
