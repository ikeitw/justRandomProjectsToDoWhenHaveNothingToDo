module.exports = (sequelize, DataTypes) => {
    return sequelize.define('SaleStats', {
        soldLastYear: DataTypes.INTEGER,
        soldThisYear: DataTypes.INTEGER
    });
};
