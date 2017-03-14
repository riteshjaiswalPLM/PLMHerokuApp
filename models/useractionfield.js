module.exports = function (sequelize, DataTypes) {
    var UserActionField = sequelize.define("UserActionField", {
        type: {
            type: DataTypes.ENUM,
            values: ['Optional', 'Readonly', 'Required']
        },
    }, {
            classMethods: {
                associate: function (models) {
                    UserActionField.belongsTo(models.UserAction);
                    UserActionField.belongsTo(models.SObjectField);
                }
            }
        });

    return UserActionField;
};