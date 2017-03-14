module.exports = function (sequelize, DataTypes) {
    var UserAction = sequelize.define("UserAction", {
        actionvalue: {
            type: DataTypes.STRING,
            allowNull: false
        },
    }, {
            classMethods: {
                associate: function (models) {
                    UserAction.belongsTo(models.SObject);

                    UserAction.hasMany(models.UserActionField, {
                        onDelete: 'CASCADE',
                        hooks: true
                    });
                }
            }
        });

    return UserAction;
};