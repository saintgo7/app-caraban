import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn('users', 'kakaoId', {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('users', 'kakaoId');
  },
};
