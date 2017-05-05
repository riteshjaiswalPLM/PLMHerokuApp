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
            values: ['UploadAttachment','MultiLevelApproval','DashboardMyTask','DashboardChart']
        },
        forMobile: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: function(){
                return false;
            }
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
                Components.hasMany(models.DashboardContainersComponents, {
                    onDelete: 'CASCADE', 
                    hooks: true
                });
                Components.hasMany(models.SObjectLayoutSection, {
                    onDelete: 'CASCADE', 
                    hooks: true
                });
                Components.belongsTo(models.SObject,{
                    onDelete: 'CASCADE',
                    hooks:true
                });
                Components.belongsTo(models.SObject,{
                    as : 'detailSObject',
                    onDelete: 'CASCADE',
                    hooks:true
                });
                Components.belongsTo(models.SObject,{
                    as : 'approvalDetailSObject',
                    onDelete: 'CASCADE',
                    hooks:true
                });
            }
        }
    });

    return Components;
};