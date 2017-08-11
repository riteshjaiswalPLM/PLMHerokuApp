module.exports = function (sequelize, DataTypes) {
    var SObjectReportField = sequelize.define("SObjectReportField", {
        label: {
            type: DataTypes.STRING,
            defaultValue: function () {
                return 'Undefined';
            }
        },
        type: {
            type: DataTypes.ENUM,
            values: ['Report-Criteria-Field', 'Report-Result-Field']
        },
        reference: {
            type: DataTypes.STRING,
            allowNull: true
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: function () {
                return 0;
            }
        },
        deleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: function () {
                return false;
            }
        },
        fromfield: {
            type: DataTypes.BOOLEAN,
        },
        tofield: {
            type: DataTypes.BOOLEAN,
        }
    }, {
            classMethods: {
                associate: function (models) {
                    SObjectReportField.belongsTo(models.SObjectReport);
                    SObjectReportField.belongsTo(models.SObjectField);
                }
            }
        });

    return SObjectReportField;
};