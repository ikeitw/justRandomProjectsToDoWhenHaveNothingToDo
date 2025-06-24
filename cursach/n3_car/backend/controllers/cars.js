const Car = require('../models/Car');
const {Dealership} = require("../models");

exports.getAll = async (req, res) => {
    const cars = await Car.findAll({
        include: [Dealership]
    });
    res.json(cars);
};

exports.create = async (req, res) => {
    const car = await Car.create(req.body);
    res.json(car);
};

exports.getById = async (req, res) => {
    const car = await Car.findByPk(req.params.id, {
        include: [Dealership]
    });
    res.json(car);
};

exports.update = async (req, res) => {
    await Car.update(req.body, { where: { id: req.params.id } });
    const updated = await Car.findByPk(req.params.id);
    res.json(updated);
};

exports.remove = async (req, res) => {
    await Car.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
};
