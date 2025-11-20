import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ReservationAttributes {
  id: string;
  campsiteId: string;
  userId: string;
  checkInDate: Date;
  checkOutDate: Date;
  guestCount: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: string;
  specialRequests?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReservationCreationAttributes extends Optional<ReservationAttributes, 'id' | 'status' | 'paymentStatus' | 'createdAt' | 'updatedAt'> { }

class Reservation extends Model<ReservationAttributes, ReservationCreationAttributes> implements ReservationAttributes {
  public id!: string;
  public campsiteId!: string;
  public userId!: string;
  public checkInDate!: Date;
  public checkOutDate!: Date;
  public guestCount!: number;
  public totalPrice!: number;
  public status!: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  public paymentStatus!: 'pending' | 'paid' | 'refunded';
  public paymentMethod?: string;
  public specialRequests?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper method to get number of nights
  public getNumberOfNights(): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const diff = this.checkOutDate.getTime() - this.checkInDate.getTime();
    return Math.ceil(diff / msPerDay);
  }
}

Reservation.init(
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
    checkInDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    checkOutDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isAfterCheckIn(value: Date) {
          if (value <= (this as any).checkInDate) {
            throw new Error('체크아웃 날짜는 체크인 날짜 이후여야 합니다.');
          }
        },
      },
    },
    guestCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
      defaultValue: 'pending',
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded'),
      defaultValue: 'pending',
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    specialRequests: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'reservations',
    timestamps: true,
    indexes: [
      {
        fields: ['campsiteId', 'checkInDate', 'checkOutDate'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default Reservation;
