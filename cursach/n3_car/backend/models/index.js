const sequelize = require('../database');
const Car = require('./Car');
const Buyer = require('./Buyer');
const Dealership = require('./Dealership');

Dealership.hasMany(Car, { onDelete: 'CASCADE' });
Car.belongsTo(Dealership);

module.exports = {
    sequelize,
    Car,
    Buyer,
    Dealership,
};
