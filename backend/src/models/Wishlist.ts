import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface WishlistAttributes {
  id: string;
  userId: string;
  campsiteId: string;
  notes?: string;
  notifyOnAvailability: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WishlistCreationAttributes extends Optional<WishlistAttributes, 'id' | 'notifyOnAvailability' | 'createdAt' | 'updatedAt'> {}

class Wishlist extends Model<WishlistAttributes, WishlistCreationAttributes> implements WishlistAttributes {
  public id!: string;
  public userId!: string;
  public campsiteId!: string;
  public notes?: string;
  public notifyOnAvailability!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association methods
  public static associate(models: any): void {
    Wishlist.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    Wishlist.belongsTo(models.Campsite, {
      foreignKey: 'campsiteId',
      as: 'campsite',
    });
  }
}

Wishlist.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    campsiteId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'campsites',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notifyOnAvailability: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'wishlists',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'campsiteId'],
      },
      { fields: ['userId'] },
      { fields: ['campsiteId'] },
    ],
  }
);

export default Wishlist;
