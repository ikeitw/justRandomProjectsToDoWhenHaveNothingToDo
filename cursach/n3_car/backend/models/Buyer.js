const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Buyer = sequelize.define('Buyer', {
    fullName: DataTypes.STRING,
    contactInfo: DataTypes.STRING,
    preferredFirm: DataTypes.STRING,
    preferredModel: DataTypes.STRING,
    preferredYear: DataTypes.INTEGER,
    preferredPower: DataTypes.INTEGER,
    preferredTransmission: DataTypes.ENUM('МКП', 'АКП'),
    preferredCondition: DataTypes.ENUM('новая', 'с пробегом'),
    maxPrice: DataTypes.INTEGER
});

module.exports = Buyer;
