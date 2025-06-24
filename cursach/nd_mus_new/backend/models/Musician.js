const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Musician = sequelize.define('Musician', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fullName: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING },
    instruments: { type: DataTypes.ARRAY(DataTypes.STRING) }
});

module.exports = Musician;
