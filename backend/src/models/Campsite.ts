import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CampsiteAttributes {
  id: string;
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'auto' | 'glamping' | 'caravan' | 'general';
  maxCapacity: number;
  pricePerNight: number;
  checkInTime: string;
  checkOutTime: string;
  amenities?: string;
  images?: string;
  rating?: number;
  reviewCount: number;
  ownerId: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CampsiteCreationAttributes extends Optional<CampsiteAttributes, 'id' | 'rating' | 'reviewCount' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Campsite extends Model<CampsiteAttributes, CampsiteCreationAttributes> implements CampsiteAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public address!: string;
  public latitude!: number;
  public longitude!: number;
  public type!: 'auto' | 'glamping' | 'caravan' | 'general';
  public maxCapacity!: number;
  public pricePerNight!: number;
  public checkInTime!: string;
  public checkOutTime!: string;
  public amenities?: string;
  public images?: string;
  public rating?: number;
  public reviewCount!: number;
  public ownerId!: string;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Campsite.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('auto', 'glamping', 'caravan', 'general'),
      allowNull: false,
      defaultValue: 'general',
    },
    maxCapacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    pricePerNight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    checkInTime: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: '14:00',
    },
    checkOutTime: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: '11:00',
    },
    amenities: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of amenities',
    },
    images: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of image URLs',
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: true,
      validate: {
        min: 0,
        max: 5,
      },
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'campsites',
    timestamps: true,
    indexes: [
      {
        fields: ['latitude', 'longitude'],
      },
      {
        fields: ['type'],
      },
      {
        fields: ['rating'],
      },
    ],
  }
);

export default Campsite;
