module.exports = function (sequelize, DataTypes) {
    var ArchivalSetupDetail = sequelize.define("ArchivalSetupDetail", {
        ArchivalNamespace: {
            type: DataTypes.STRING
        },
        AWSEC2Url: {
            type: DataTypes.STRING,
        },
        AWSS3Bucket: {
            type: DataTypes.STRING
        },
        AWSS3Key: {
            type: DataTypes.STRING
        },
        AWSS3Region: {
            type: DataTypes.STRING
        },
        AWSS3Secret: {
            type: DataTypes.STRING
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
            type: DataTypes.BOOLEAN
        },
    })
    return ArchivalSetupDetail;
};