const Buyer = require('../models/Buyer');

exports.getAll = async (req, res) => {
    const buyers = await Buyer.findAll();
    res.json(buyers);
};

exports.create = async (req, res) => {
    const buyer = await Buyer.create(req.body);
    res.json(buyer);
};

exports.getById = async (req, res) => {
    const buyer = await Buyer.findByPk(req.params.id);
    res.json(buyer);
};

exports.update = async (req, res) => {
    await Buyer.update(req.body, { where: { id: req.params.id } });
    const updated = await Buyer.findByPk(req.params.id);
    res.json(updated);
};

exports.remove = async (req, res) => {
    await Buyer.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
};
