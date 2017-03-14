module.exports = function(sequelize, DataTypes){
    var Components = sequelize.define("Components",{
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        desc: {
            type: DataTypes.STRING,
            allowNull: true
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: function(){
                return false;
            }
        },
        catagory: {
            type: DataTypes.ENUM,
            values: ['UploadAttachment','DashboardMyTask','DashboardChart']
        }
    },{
        classMethods: {
            associate: function(models){
                Components.hasMany(models.SObjectLayoutField, {
                    onDelete: 'CASCADE', 
                    hooks: true
                });
                Components.hasMany(models.ComponentDetail, {
                    onDelete: 'CASCADE', 
                    hooks: true
                });
                Components.belongsTo(models.SObject,{
                    onDelete: 'CASCADE',
                    hooks:true
                });
            }
        }
    });

    return Components;
};