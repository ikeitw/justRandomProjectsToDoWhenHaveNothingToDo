const { Composition } = require('../models');

exports.getAllCompositions = async (req, res) => {
    const compositions = await Composition.findAll();
    res.json(compositions);
};

exports.addComposition = async (req, res) => {
    const { name, musicianId } = req.body;
    const newComp = await Composition.create({ name, musicianId });
    res.status(201).json(newComp);
};

exports.updateComposition = async (req, res) => {
    const id = req.params.id;
    const comp = await Composition.findByPk(id);
    if (!comp) return res.status(404).json({ error: 'Composition not found' });

    await comp.update(req.body);
    res.json(comp);
};

exports.deleteComposition = async (req, res) => {
    const id = req.params.id;
    const comp = await Composition.findByPk(id);
    if (!comp) return res.status(404).json({ error: 'Composition not found' });

    await comp.destroy();
    res.json({ success: true });
};
