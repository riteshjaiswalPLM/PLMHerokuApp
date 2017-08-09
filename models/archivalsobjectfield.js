module.exports = function (sequelize, DataTypes) {
    var ArchivalSobjectField = sequelize.define("ArchivalSobjectField", {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
            classMethods: {
                associate: function (models) {
                    ArchivalSobjectField.belongsTo(models.SObjectField); 
                    ArchivalSobjectField.belongsTo(models.ArchivalSobject);
                }
            }
        });
    return ArchivalSobjectField;
};