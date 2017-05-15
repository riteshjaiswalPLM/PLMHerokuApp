module.exports = function(sequelize, DataTypes){
    var TimeZone = sequelize.define("TimeZone",{
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    });
    
    return TimeZone;  
};