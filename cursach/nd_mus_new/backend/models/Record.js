const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Record = sequelize.define('Record', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    label: { type: DataTypes.STRING, allowNull: false },
    mediaType: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['vinyl', 'cd', 'cassette', 'floppy', 'digital']]
        }
    },
    releaseDate: { type: DataTypes.DATEONLY },
    wholesalePrice: { type: DataTypes.FLOAT },
    retailPrice: { type: DataTypes.FLOAT },
    soldLastYear: { type: DataTypes.INTEGER, defaultValue: 0 },
    soldThisYear: { type: DataTypes.INTEGER, defaultValue: 0 },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 }
});

module.exports = Record;
