module.exports = function(sequelize, DataTypes){
    var Locale = sequelize.define("Locale",{
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        dateTimeFormat: {
            type: DataTypes.STRING,
            allowNull: false
        },
        dateFormat: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
    
    return Locale;  
};