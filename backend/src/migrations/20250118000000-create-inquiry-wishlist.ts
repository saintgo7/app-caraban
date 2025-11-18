import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Create inquiries table
    await queryInterface.createTable('inquiries', {
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
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
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
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    // Create wishlists table
    await queryInterface.createTable('wishlists', {
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
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    // Add indexes for inquiries
    await queryInterface.addIndex('inquiries', ['userId']);
    await queryInterface.addIndex('inquiries', ['campsiteId']);
    await queryInterface.addIndex('inquiries', ['status']);
    await queryInterface.addIndex('inquiries', ['createdAt']);

    // Add indexes for wishlists
    await queryInterface.addIndex('wishlists', ['userId']);
    await queryInterface.addIndex('wishlists', ['campsiteId']);
    await queryInterface.addIndex('wishlists', ['userId', 'campsiteId'], { unique: true });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('inquiries');
    await queryInterface.dropTable('wishlists');
  },
};
