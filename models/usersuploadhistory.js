module.exports = function (sequelize, DataTypes) {
    var UsersUploadHistory = sequelize.define("UsersUploadHistory", {
        recordsinserted: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: function () {
                return 0;
            }
        },
        recordsupdated: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: function () {
                return 0;
            }
        },
        recordsfailed: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: function () {
                return 0;
            }
        },
        invalidrecords: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: function () {
                return 0;
            }
        },
        filename: {
            type: DataTypes.STRING,
            allowNull: false
        },
        uploadresult: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: function () {
                return undefined;
            },
            set: function (value) {
                this.setDataValue('uploadresult', JSON.stringify(value));
            },
            get: function () {
                if (this.getDataValue('uploadresult') !== undefined)
                    return JSON.parse(this.getDataValue('uploadresult'));
                else
                    this.getDataValue('uploadresult');
            }
        },
        createdby: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });

    return UsersUploadHistory;
};