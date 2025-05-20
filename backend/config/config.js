require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'gyulhap_dev',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    port: process.env.DB_PORT || 5432
  },
  test: {
    username: process.env.DB_USERNAME_TEST || 'postgres',
    password: process.env.DB_PASSWORD_TEST || 'password',
    database: process.env.DB_NAME_TEST || 'gyulhap_test',
    host: process.env.DB_HOST_TEST || 'localhost',
    dialect: 'postgres',
    port: process.env.DB_PORT_TEST || 5432
  },
  production: {
    username: process.env.DB_USERNAME_PROD,
    password: process.env.DB_PASSWORD_PROD,
    database: process.env.DB_NAME_PROD,
    host: process.env.DB_HOST_PROD,
    dialect: 'postgres',
    port: process.env.DB_PORT_PROD,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Ajuste conforme a configuração do seu servidor PostgreSQL
      }
    }
  }
};
