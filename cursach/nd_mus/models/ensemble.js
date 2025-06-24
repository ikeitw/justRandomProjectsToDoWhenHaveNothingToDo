module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Ensemble', {
        name: DataTypes.STRING,
        type: DataTypes.STRING // Оркестр, квартет и т.д.
    });
};
