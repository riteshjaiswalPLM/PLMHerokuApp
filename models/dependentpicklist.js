module.exports = function (sequelize, DataTypes) {
    var DependentPicklist = sequelize.define("DependentPicklist", {
        parentfieldvalue: {
            type: DataTypes.STRING,
            allowNull: false
        },
    }, {
            classMethods: {
                associate: function (models) {
                    DependentPicklist.belongsTo(models.SObject);
                    DependentPicklist.belongsTo(models.SObjectField,{
                        as : 'parentSObjectField',
                        onDelete: 'CASCADE',
                        hooks:true
                    });
                    DependentPicklist.belongsTo(models.SObjectField,{
                        as : 'childSObjectField',
                        onDelete: 'CASCADE',
                        hooks:true
                    });
                    DependentPicklist.belongsTo(models.SObjectField,{
                        as : 'userTypeSObjectField',
                        onDelete: 'CASCADE',
                        hooks:true
                    });
                    DependentPicklist.hasMany(models.DependentPicklistChildValue, {
                        onDelete: 'CASCADE',
                        hooks: true
                    });
                   
                }
            }
        });

    return DependentPicklist;
};