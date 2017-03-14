module.exports = function(sequelize, DataTypes){
    var Tab = sequelize.define("Tab",{
        label: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        created: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: function(){
                return false;
            }
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
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
        }
    },{
        classMethods: {
            associate: function(models){
                Tab.belongsTo(models.SObject);
                Tab.belongsTo(models.SObjectLayout);
                Tab.belongsTo(models.Icon);
            }
        }
    });
    
    return Tab;  
};