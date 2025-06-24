module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Record', {
        title: DataTypes.STRING,
        releaseDate: DataTypes.DATE,
        wholesalePrice: DataTypes.FLOAT,
        retailPrice: DataTypes.FLOAT,
        stock: DataTypes.INTEGER
    });
};
