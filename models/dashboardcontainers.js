module.exports = function(sequelize, DataTypes){
    var DashboarContainer = sequelize.define("DashboarContainer",{
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        label: {
            type: DataTypes.STRING,
            allowNull: true
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: function(){
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
        deleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: function () {
                return false;
            }
        },
        allowedType:{
            type: DataTypes.ENUM,
            values: ['ClientDashbordMyTaskContainerComponent', 'ClientDashbordChartContainerComponent']
        }

    },{
        classMethods: {
            associate: function(models){
                DashboarContainer.hasMany(models.DashboardContainersComponents, {
                    onDelete: 'CASCADE', 
                    hooks: true
                });
            }
        }
    });

    return DashboarContainer;
};