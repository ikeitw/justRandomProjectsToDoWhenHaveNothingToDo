const { Record } = require('../models');

exports.getAllRecords = async (req, res) => {
    const records = await Record.findAll();
    res.json(records);
};

exports.addRecord = async (req, res) => {
    const data = req.body;
    const newRecord = await Record.create(data);
    res.status(201).json(newRecord);
};

exports.updateRecord = async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    const record = await Record.findByPk(id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    await record.update(data);
    res.json(record);
};

exports.deleteRecord = async (req, res) => {
    const id = req.params.id;
    const rec = await Record.findByPk(id);
    if (!rec) return res.status(404).json({ error: 'Record not found' });

    await rec.destroy();
    res.json({ success: true });
};
