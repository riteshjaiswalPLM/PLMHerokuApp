module.exports = function (sequelize, DataTypes) {
    var Logo = sequelize.define("Logo", {
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        logo: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    });

    return Logo;
};