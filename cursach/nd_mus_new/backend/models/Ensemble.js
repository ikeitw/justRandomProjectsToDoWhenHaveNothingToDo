const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Ensemble = sequelize.define('Ensemble', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING }
});

module.exports = Ensemble;
