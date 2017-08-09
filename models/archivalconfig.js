module.exports = function (sequelize, DataTypes) {
    var ArchivalConfig = sequelize.define("ArchivalConfig", {
        AWSS3Url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        AWSS3Secret: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    })
    return ArchivalConfig;
};