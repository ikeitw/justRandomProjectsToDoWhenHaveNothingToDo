module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Composition', {
        title: DataTypes.STRING,
        genre: DataTypes.STRING
    });
};
