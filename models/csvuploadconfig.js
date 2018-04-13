module.exports = function (sequelize, DataTypes) {
    var CSVUploadConfig = sequelize.define("CSVUploadConfig", {
        mappingType: {
            type: DataTypes.ENUM,
            values: ['Value Mapping', 'Field Mapping']
        },
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
        defaultValue: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isUniqueField: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: function () {
                return false;
            }
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