// models/index.js
const { Sequelize } = require('sequelize');

// Koneksi ke database
const sequelize = new Sequelize('mysql://root@localhost:3306/db_lost'); // Sesuaikan dengan kredensial Anda

module.exports = { sequelize };
