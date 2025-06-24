const { Musician } = require('../models');

exports.getAllMusicians = async (req, res) => {
    const musicians = await Musician.findAll();
    res.json(musicians);
};

exports.addMusician = async (req, res) => {
    const { name, role, instrument } = req.body;
    const newMusician = await Musician.create({ name, role, instrument });
    res.status(201).json(newMusician);
};

exports.updateMusician = async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    const musician = await Musician.findByPk(id);
    if (!musician) return res.status(404).json({ error: 'Musician not found' });

    await musician.update(data);
    res.json(musician);
};

exports.deleteMusician = async (req, res) => {
    const id = req.params.id;
    const musician = await Musician.findByPk(id);
    if (!musician) return res.status(404).json({ error: 'Musician not found' });

    await musician.destroy();
    res.json({ success: true });
};
