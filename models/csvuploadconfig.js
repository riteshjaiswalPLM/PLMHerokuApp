module.exports = function (sequelize, DataTypes) {
    var CSVUploadConfig = sequelize.define("CSVUploadConfig", {
        sfFieldName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        label: {
            type: DataTypes.STRING,
            allowNull: false
        },
        csvFieldName: {
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
        defaultValue: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // required: {
        //     type: DataTypes.BOOLEAN,
        //     allowNull: false,
        //     defaultValue: function () {
        //         return false;
        //     }
        // },
        isUniqueField: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: function () {
                return false;
            }
        },
        referenceSObjectName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        referenceFieldName: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
            classMethods: {
                associate: function (models) {
                    CSVUploadConfig.belongsTo(models.SObject, {
                        onDelete: 'CASCADE',
                        hooks: true
                    });
                    CSVUploadConfig.belongsTo(models.SObject, {
                        as: 'detailSObject',
                        onDelete: 'CASCADE',
                        hooks: true
                    });
                }
            }
        });

    return CSVUploadConfig;
};