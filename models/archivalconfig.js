module.exports = function (sequelize, DataTypes) {
    var ArchivalConfig = sequelize.define("ArchivalConfig", {
        ArchivalNamespace: {
            type: DataTypes.STRING
        },
        AWSEC2Url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        AWSS3Bucket: {
            type: DataTypes.STRING
        },
        AAWSS3Key: {
            type: DataTypes.STRING
        },
        AAWSS3Region: {
            type: DataTypes.STRING
        },
        AWSS3Secret: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        AWSS3Service: {
            type: DataTypes.STRING
        },
        AWSS3Url: {
            type: DataTypes.STRING

        },
        BatchSizeConfiguration: {
            type: DataTypes.STRING
        },
        EnableSSEncryption: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
    })
    return ArchivalConfig;
};