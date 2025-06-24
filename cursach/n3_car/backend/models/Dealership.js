const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Dealership = sequelize.define('Dealership', {
    name: DataTypes.STRING
});

module.exports = Dealership;
