const { Ensemble } = require('../models');

exports.getAllEnsembles = async (req, res) => {
    const ensembles = await Ensemble.findAll();
    res.json(ensembles);
};

exports.addEnsemble = async (req, res) => {
    const { name, type } = req.body;
    const newEns = await Ensemble.create({ name, type });
    res.status(201).json(newEns);
};


exports.updateEnsemble = async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    const ens = await Ensemble.findByPk(id);
    if (!ens) return res.status(404).json({ error: 'Ensemble not found' });

    await ens.update(data);
    res.json(ens);
};

exports.deleteEnsemble = async (req, res) => {
    const id = req.params.id;
    const ens = await Ensemble.findByPk(id);
    if (!ens) return res.status(404).json({ error: 'Ensemble not found' });

    await ens.destroy();
    res.json({ success: true });
};