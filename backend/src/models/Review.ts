import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ReviewAttributes {
  id: string;
  campsiteId: string;
  userId: string;
  reservationId?: string;
  rating: number;
  title: string;
  content: string;
  images?: string;
  ownerReply?: string;
  ownerReplyDate?: Date;
  isVisible: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReviewCreationAttributes extends Optional<ReviewAttributes, 'id' | 'isVisible' | 'createdAt' | 'updatedAt'> {}

class Review extends Model<ReviewAttributes, ReviewCreationAttributes> implements ReviewAttributes {
  public id!: string;
  public campsiteId!: string;
  public userId!: string;
  public reservationId?: string;
  public rating!: number;
  public title!: string;
  public content!: string;
  public images?: string;
  public ownerReply?: string;
  public ownerReplyDate?: Date;
  public isVisible!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Review.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    campsiteId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'campsites',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reservationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'reservations',
        key: 'id',
      },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    images: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of image URLs',
    },
    ownerReply: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ownerReplyDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'reviews',
    timestamps: true,
    indexes: [
      {
        fields: ['campsiteId'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['rating'],
      },
    ],
  }
);

export default Review;
