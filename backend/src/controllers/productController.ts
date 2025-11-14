import { Response, NextFunction } from 'express';
import { Product, Category } from '../models';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export const getAllProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, categoryId, search, isActive } = req.query;

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.name = { $like: `%${search}%` };
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category' }],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [{ model: Category, as: 'category' }],
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    res.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      sku,
      name,
      description,
      categoryId,
      price,
      costPrice,
      stockQuantity,
      minStockLevel,
      unit,
      imageUrl,
    } = req.body;

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ where: { sku } });
    if (existingProduct) {
      throw new AppError('Product with this SKU already exists', 400);
    }

    // Check if category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const product = await Product.create({
      sku,
      name,
      description,
      categoryId,
      price,
      costPrice,
      stockQuantity,
      minStockLevel,
      unit,
      imageUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // If SKU is being updated, check for duplicates
    if (updateData.sku && updateData.sku !== product.sku) {
      const existingProduct = await Product.findOne({
        where: { sku: updateData.sku },
      });
      if (existingProduct) {
        throw new AppError('Product with this SKU already exists', 400);
      }
    }

    // If category is being updated, check if it exists
    if (updateData.categoryId) {
      const category = await Category.findByPk(updateData.categoryId);
      if (!category) {
        throw new AppError('Category not found', 404);
      }
    }

    await product.update(updateData);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Soft delete - just deactivate
    await product.update({ isActive: false });

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'

    const product = await Product.findByPk(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    let newQuantity = product.stockQuantity;
    if (operation === 'add') {
      newQuantity += quantity;
    } else if (operation === 'subtract') {
      newQuantity -= quantity;
      if (newQuantity < 0) {
        throw new AppError('Insufficient stock', 400);
      }
    } else {
      throw new AppError('Invalid operation', 400);
    }

    await product.update({ stockQuantity: newQuantity });

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};
