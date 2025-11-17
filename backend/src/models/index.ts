import User from './User';
import Category from './Category';
import Product from './Product';
import Order from './Order';
import OrderItem from './OrderItem';
import Campsite from './Campsite';
import Reservation from './Reservation';
import Review from './Review';
import Favorite from './Favorite';

// ===== ERP System Associations =====
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

// ===== Camping System Associations =====

// User - Campsite (Owner)
User.hasMany(Campsite, {
  foreignKey: 'ownerId',
  as: 'campsites',
});

Campsite.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner',
});

// Campsite - Reservation
Campsite.hasMany(Reservation, {
  foreignKey: 'campsiteId',
  as: 'reservations',
});

Reservation.belongsTo(Campsite, {
  foreignKey: 'campsiteId',
  as: 'campsite',
});

// User - Reservation
User.hasMany(Reservation, {
  foreignKey: 'userId',
  as: 'myReservations',
});

Reservation.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Campsite - Review
Campsite.hasMany(Review, {
  foreignKey: 'campsiteId',
  as: 'reviews',
});

Review.belongsTo(Campsite, {
  foreignKey: 'campsiteId',
  as: 'campsite',
});

// User - Review
User.hasMany(Review, {
  foreignKey: 'userId',
  as: 'myReviews',
});

Review.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Reservation - Review
Reservation.hasOne(Review, {
  foreignKey: 'reservationId',
  as: 'review',
});

Review.belongsTo(Reservation, {
  foreignKey: 'reservationId',
  as: 'reservation',
});

// User - Favorite - Campsite
User.hasMany(Favorite, {
  foreignKey: 'userId',
  as: 'favorites',
});

Favorite.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Campsite.hasMany(Favorite, {
  foreignKey: 'campsiteId',
  as: 'favoritedBy',
});

Favorite.belongsTo(Campsite, {
  foreignKey: 'campsiteId',
  as: 'campsite',
});

export {
  // ERP Models
  User,
  Category,
  Product,
  Order,
  OrderItem,
  // Camping Models
  Campsite,
  Reservation,
  Review,
  Favorite,
};

export default {
  User,
  Category,
  Product,
  Order,
  OrderItem,
  Campsite,
  Reservation,
  Review,
  Favorite,
};
