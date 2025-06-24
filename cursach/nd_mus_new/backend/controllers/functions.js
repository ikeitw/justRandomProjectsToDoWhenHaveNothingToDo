const { sequelize } = require('../models');

exports.getCompositionCount = async (req, res) => {
    const id = req.params.id;
    const result = await sequelize.query(
        `SELECT get_ensemble_compositions_count(:id) AS count`,
        { replacements: { id }, type: sequelize.QueryTypes.SELECT }
    );
    res.json(result[0]);
};

exports.getEnsembleCDs = async (req, res) => {
    const id = req.params.id;
    const result = await sequelize.query(
        `SELECT * FROM get_ensemble_records(:id)`,
        { replacements: { id }, type: sequelize.QueryTypes.SELECT }
    );
    res.json(result);
};

exports.getTopSelling = async (req, res) => {
    const result = await sequelize.query(
        `SELECT * FROM top_selling_records()`,
        { type: sequelize.QueryTypes.SELECT }
    );
    res.json(result);
};
