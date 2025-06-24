module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Musician', {
        name: DataTypes.STRING,
        role: DataTypes.STRING // Исполнитель, композитор, дирижер и т.д.
    });
};
