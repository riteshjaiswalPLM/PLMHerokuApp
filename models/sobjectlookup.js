module.exports = function(sequelize, DataTypes){
    var SObjectLookup = sequelize.define("SObjectLookup",{
        sobjectname: {
            type: DataTypes.STRING  
        },
        title: {
            type: DataTypes.STRING  
        },
        description: {
            type: DataTypes.STRING  
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: function(){
                return false;
            }
        },
        default: {
            type: DataTypes.BOOLEAN,
            defaultValue: function(){
                return false;
            }
        }
    },{
        classMethods: {
            associate: function(models){
                SObjectLookup.belongsTo(models.SObject);
                
                SObjectLookup.hasMany(models.SObjectLayoutField, {
                    onDelete: 'CASCADE', 
                    hooks: true
                });
            }
        }
    });
    
    return SObjectLookup;  
};