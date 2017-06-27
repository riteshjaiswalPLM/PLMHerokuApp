module.exports = function (sequelize, DataTypes) {
    var UsersUploadConfig = sequelize.define("UsersUploadConfig", {
        sfFieldName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        label: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fileFieldName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        datatype: {
            type: DataTypes.STRING,
            allowNull: false
        },
        datatypeFormat: {
            type: DataTypes.STRING,
            allowNull: true
        },
        stringLength: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: function () {
                return 0;
            }
        },
        required: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: function () {
                return false;
            }
        },
        isUsernameField: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: function () {
                return false;
            }
        },
        referenceTableName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        referenceFieldName: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });

    return UsersUploadConfig;
};