const Dealership = require('../models/Dealership');
const Car = require('../models/Car');

exports.getAll = async (req, res) => {
    const dealerships = await Dealership.findAll();
    res.json(dealerships);
};

exports.create = async (req, res) => {
    const d = await Dealership.create(req.body);
    res.json(d);
};

exports.getCars = async (req, res) => {
    const cars = await Car.findAll({ where: { DealershipId: req.params.id } });
    res.json(cars);
};

exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        const dealership = await Dealership.findByPk(id);
        if (!dealership) {
            return res.status(404).json({ message: 'Dealership not found' });
        }
        await dealership.destroy();
        res.json({ message: 'Dealership deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const dealership = await Dealership.findByPk(id);
        if (!dealership) {
            return res.status(404).json({ message: 'Dealership not found' });
        }
        await dealership.update(req.body);
        res.json({ message: 'Dealership updated successfully', dealership });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
