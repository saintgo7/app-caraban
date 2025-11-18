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
  images?: string[];
  isVerified: boolean;
  ownerReply?: string;
  ownerReplyDate?: Date;
  adminResponse?: string;
  adminResponseDate?: Date;
  helpfulCount: number;
  reportCount: number;
  isVisible: boolean;
  isApproved: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReviewCreationAttributes extends Optional<ReviewAttributes, 'id' | 'isVisible' | 'isVerified' | 'helpfulCount' | 'reportCount' | 'isApproved' | 'createdAt' | 'updatedAt'> {}

class Review extends Model<ReviewAttributes, ReviewCreationAttributes> implements ReviewAttributes {
  public id!: string;
  public campsiteId!: string;
  public userId!: string;
  public reservationId?: string;
  public rating!: number;
  public title!: string;
  public content!: string;
  public images?: string[];
  public isVerified!: boolean;
  public ownerReply?: string;
  public ownerReplyDate?: Date;
  public adminResponse?: string;
  public adminResponseDate?: Date;
  public helpfulCount!: number;
  public reportCount!: number;
  public isVisible!: boolean;
  public isApproved!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual fields for associations
  public readonly user?: any;
  public readonly campsite?: any;

  // Static methods
  public static async getAverageRating(campsiteId: string): Promise<{ averageRating: number; totalReviews: number }> {
    const result = await Review.findAll({
      where: {
        campsiteId,
        isApproved: true,
        isVisible: true,
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews'],
      ],
      raw: true,
    });

    const data = result[0] as any;
    return {
      averageRating: parseFloat(data.averageRating) || 0,
      totalReviews: parseInt(data.totalReviews) || 0,
    };
  }

  public static async canUserReview(userId: string, campsiteId: string, reservationId?: string): Promise<boolean> {
    const existingReview = await Review.findOne({
      where: {
        userId,
        campsiteId,
        ...(reservationId && { reservationId }),
      },
    });

    return !existingReview;
  }
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
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of image URLs',
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'True if user actually stayed at the campsite',
    },
    ownerReply: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reply from campsite owner/manager',
    },
    ownerReplyDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    adminResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Response from platform admin',
    },
    adminResponseDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    helpfulCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of users who found this review helpful',
    },
    reportCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of reports for inappropriate content',
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Can be hidden by user or admin',
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Admin can hide inappropriate reviews',
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
      {
        fields: ['createdAt'],
      },
      {
        fields: ['isApproved', 'isVisible'],
      },
      {
        fields: ['helpfulCount'],
      },
    ],
  }
);

export default Review;
