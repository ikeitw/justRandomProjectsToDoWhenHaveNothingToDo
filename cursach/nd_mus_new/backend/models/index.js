const sequelize = require('../database');
const Musician = require('./Musician');
const Ensemble = require('./Ensemble');
const Composition = require('./Composition');
const Record = require('./Record');
const Performance = require('./Performance');

Ensemble.hasMany(Performance, { foreignKey: 'ensembleId', onDelete: 'CASCADE', hooks: true });
Performance.belongsTo(Ensemble, { foreignKey: 'ensembleId' });

Composition.hasMany(Performance, { foreignKey: 'compositionId', onDelete: 'CASCADE', hooks: true });
Performance.belongsTo(Composition, { foreignKey: 'compositionId' });

Record.hasMany(Performance, { foreignKey: 'recordId', onDelete: 'CASCADE', hooks: true });
Performance.belongsTo(Record, { foreignKey: 'recordId' });

Composition.belongsTo(Musician, { as: 'composer', foreignKey: 'composerId' });

module.exports = {
    sequelize,
    Musician,
    Ensemble,
    Composition,
    Record,
    Performance
};
