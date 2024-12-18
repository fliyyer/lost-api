const { DataTypes } = require('sequelize');
const { sequelize } = require('./index'); 

const Item = sequelize.define('Item', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastLocation: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  photo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
    status: {
      type: DataTypes.ENUM('Checking', 'Accepted','Available'),
      allowNull: false,
      defaultValue: 'Available',
    },
    claimedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    }
});

module.exports = Item;
