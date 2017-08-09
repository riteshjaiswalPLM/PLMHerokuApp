module.exports = function (sequelize, DataTypes) {
    var ArchivalSobject = sequelize.define("ArchivalSobject", {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
            classMethods: {
                associate: function (models) {
                    ArchivalSobject.belongsTo(models.SObject);
                    ArchivalSobject.hasMany(models.ArchivalSobjectField, {
                        onDelete: 'CASCADE',
                        hooks: true
                    });
                    ArchivalSobject.hasMany(models.SObjectLayout, {
                        onDelete: 'CASCADE',
                        hooks: true
                    });
                }
            }
        });

    return ArchivalSobject;
};