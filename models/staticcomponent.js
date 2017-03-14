module.exports = function(sequelize, DataTypes){
    var StaticComponent = sequelize.define("StaticComponent",{
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        config: {
            type: DataTypes.TEXT,
        }
    },{
        classMethods: {
          
        }
    });

    return StaticComponent;
};