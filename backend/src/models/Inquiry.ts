import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface InquiryAttributes {
  id: string;
  userId: string;
  campsiteId: string;
  subject: string;
  message: string;
  status: 'pending' | 'answered' | 'closed';
  priority: 'low' | 'normal' | 'high';
  category: 'general' | 'booking' | 'facilities' | 'pricing' | 'cancellation' | 'other';
  response?: string;
  respondedBy?: string;
  respondedAt?: Date;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InquiryCreationAttributes extends Optional<InquiryAttributes, 'id' | 'status' | 'priority' | 'isRead' | 'createdAt' | 'updatedAt'> {}

class Inquiry extends Model<InquiryAttributes, InquiryCreationAttributes> implements InquiryAttributes {
  public id!: string;
  public userId!: string;
  public campsiteId!: string;
  public subject!: string;
  public message!: string;
  public status!: 'pending' | 'answered' | 'closed';
  public priority!: 'low' | 'normal' | 'high';
  public category!: 'general' | 'booking' | 'facilities' | 'pricing' | 'cancellation' | 'other';
  public response?: string;
  public respondedBy?: string;
  public respondedAt?: Date;
  public isRead!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association methods
  public static associate(models: any): void {
    Inquiry.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    Inquiry.belongsTo(models.Campsite, {
      foreignKey: 'campsiteId',
      as: 'campsite',
    });
    Inquiry.belongsTo(models.User, {
      foreignKey: 'respondedBy',
      as: 'responder',
    });
  }
}

Inquiry.init(
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
    subject: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200],
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, 5000],
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'answered', 'closed'),
      defaultValue: 'pending',
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high'),
      defaultValue: 'normal',
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('general', 'booking', 'facilities', 'pricing', 'cancellation', 'other'),
      allowNull: false,
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    respondedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'inquiries',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['campsiteId'] },
      { fields: ['status'] },
      { fields: ['createdAt'] },
    ],
  }
);

export default Inquiry;
