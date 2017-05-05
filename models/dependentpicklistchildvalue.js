module.exports = function (sequelize, DataTypes) {
    var DependentPicklistChildValue = sequelize.define("DependentPicklistChildValue", {
        userType: {
            type: DataTypes.STRING,
            allowNull: false
        },
        childfieldvalue: {
            type: DataTypes.TEXT,
            allowNull: false
        },
    }, {
        classMethods: {
            associate: function (models) {
                DependentPicklistChildValue.belongsTo(models.DependentPicklist);
            }
        }
    });

    return DependentPicklistChildValue;
};