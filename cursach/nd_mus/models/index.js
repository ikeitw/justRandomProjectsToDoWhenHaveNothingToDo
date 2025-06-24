const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// Импортируем модели
const Musician = require('./musician')(sequelize, DataTypes);
const Ensemble = require('./ensemble')(sequelize, DataTypes);
const Composition = require('./composition')(sequelize, DataTypes);
const Record = require('./record')(sequelize, DataTypes);
const Company = require('./company')(sequelize, DataTypes);
const Performance = require('./performance')(sequelize, DataTypes);
const SaleStats = require('./salestats')(sequelize, DataTypes);

// Связи
Ensemble.hasMany(Musician, { onDelete: 'CASCADE' });
Musician.belongsTo(Ensemble);

Ensemble.hasMany(Composition, { onDelete: 'CASCADE' });
Composition.belongsTo(Ensemble);

Composition.hasMany(Performance, { onDelete: 'CASCADE' });
Performance.belongsTo(Composition);

Record.hasMany(Performance, { onDelete: 'CASCADE' });
Performance.belongsTo(Record);

Company.hasMany(Record, { onDelete: 'CASCADE' });
Record.belongsTo(Company);

Record.hasOne(SaleStats, { onDelete: 'CASCADE' });
SaleStats.belongsTo(Record);

module.exports = {
    sequelize,
    Musician,
    Ensemble,
    Composition,
    Record,
    Company,
    Performance,
    SaleStats
};
