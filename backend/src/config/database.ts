import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Determine database type based on environment variable
const dbType = (process.env.DB_TYPE || 'sqlite').toLowerCase();

let sequelize: Sequelize;

if (dbType === 'mariadb' || dbType === 'mysql') {
  // MariaDB/MySQL configuration (for production/staging)
  console.log('🔧 Configuring MariaDB database...');
  sequelize = new Sequelize(
    process.env.DB_NAME || 'caraban_erp',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      dialect: 'mariadb',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: {
        timezone: 'Etc/GMT+0',
      },
    }
  );
} else {
  // SQLite configuration (for local development)
  console.log('🔧 Configuring SQLite database...');
  const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../../database.sqlite');

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
}

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Database connection established successfully (${dbType.toUpperCase()}).`);

    // Sync models in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized.');
    } else if (process.env.DB_SYNC === 'true') {
      // Allow forced sync in other environments if explicitly enabled
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized (forced).');
    }
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

export const getDatabaseInfo = () => {
  return {
    type: dbType,
    dialect: sequelize.getDialect(),
    database: sequelize.getDatabaseName(),
  };
};

export default sequelize;
