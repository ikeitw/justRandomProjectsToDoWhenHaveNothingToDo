const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Car = sequelize.define('Car', {
    firm: DataTypes.STRING,
    model: DataTypes.STRING,
    year: DataTypes.INTEGER,
    enginePower: DataTypes.INTEGER,
    transmission: DataTypes.ENUM('МКП', 'АКП'),
    condition: DataTypes.ENUM('новая', 'с пробегом'),
    mileage: DataTypes.INTEGER,
    features: DataTypes.STRING,
    price: DataTypes.INTEGER
});

module.exports = Car;
