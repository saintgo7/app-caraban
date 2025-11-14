import User from './User';
import Category from './Category';
import Product from './Product';
import Order from './Order';
import OrderItem from './OrderItem';

// Define associations
Category.hasMany(Product, {
  foreignKey: 'categoryId',
  as: 'products',
});

Product.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
});

User.hasMany(Order, {
  foreignKey: 'customerId',
  as: 'orders',
});

Order.belongsTo(User, {
  foreignKey: 'customerId',
  as: 'customer',
});

Order.hasMany(OrderItem, {
  foreignKey: 'orderId',
  as: 'items',
});

OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

OrderItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

Product.hasMany(OrderItem, {
  foreignKey: 'productId',
  as: 'orderItems',
});

export { User, Category, Product, Order, OrderItem };

export default {
  User,
  Category,
  Product,
  Order,
  OrderItem,
};
