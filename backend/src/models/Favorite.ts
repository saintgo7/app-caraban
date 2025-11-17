import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface FavoriteAttributes {
  id: string;
  userId: string;
  campsiteId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FavoriteCreationAttributes extends Optional<FavoriteAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Favorite extends Model<FavoriteAttributes, FavoriteCreationAttributes> implements FavoriteAttributes {
  public id!: string;
  public userId!: string;
  public campsiteId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Favorite.init(
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
    },
    campsiteId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'campsites',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'favorites',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'campsiteId'],
      },
    ],
  }
);

export default Favorite;
