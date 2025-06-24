const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Performance = sequelize.define('Performance', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    compositionId: { type: DataTypes.INTEGER, allowNull: false },
    ensembleId: { type: DataTypes.INTEGER, allowNull: false },
    recordId: { type: DataTypes.INTEGER, allowNull: false }
});

module.exports = Performance;
