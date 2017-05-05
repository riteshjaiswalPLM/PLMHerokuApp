module.exports = function(sequelize, DataTypes){
    var DashboardContainersComponents = sequelize.define("DashboardContainersComponents",{
        label: {
            type: DataTypes.STRING, 
        },
        deleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: function () {
                return false;
            }
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: function(){
                return 0;
            }
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: function(){
                return false;
            }
        },
        columns: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: function(){
                return 0;
            }
        }
    },{
        classMethods: {
            associate: function(models){
                DashboardContainersComponents.belongsTo(models.DashboarContainer, {onDelete: 'CASCADE'});
                DashboardContainersComponents.belongsTo(models.Components, {onDelete: 'CASCADE'});
            }
        }
    });
    
    return DashboardContainersComponents;
};