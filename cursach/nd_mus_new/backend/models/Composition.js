const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Composition = sequelize.define('Composition', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    composerId: { type: DataTypes.INTEGER, allowNull: false }
});

module.exports = Composition;
