module.exports = function(sequelize, DataTypes){
    var Role = sequelize.define("Role",{
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            set: function(value){
                this.setDataValue('name', value.toUpperCase());
            }
        },
        default: {
            type: DataTypes.BOOLEAN,
            allowNull: null,
            defaultValue: function(){
                return false;
            }
        },
        system: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: function(){
                return false;
            }
        }
    });
    
    return Role;  
};