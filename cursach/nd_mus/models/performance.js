module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Performance', {
        notes: DataTypes.STRING
    });
};
