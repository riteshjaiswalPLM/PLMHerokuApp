module.exports = function(sequelize, DataTypes){
    var Language = sequelize.define("Language",{
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        created: {
            type: DataTypes.BOOLEAN,
            defaultValue: function(){
                return false;
            }
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
    });

    return Language;
};