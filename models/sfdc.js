module.exports = function(sequelize, DataTypes){
    var Salesforce = sequelize.define("Salesforce",{
        // orgid: {
        //     type: DataTypes.STRING,
        //     allowNull: true
        // },
        username: {
            type: DataTypes.STRING,
            allowNull: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true
        },
        token: {
            type: DataTypes.STRING,
            allowNull: true
        },
        environment: {
            type: DataTypes.ENUM,
            allowNull: true,
            values: ['PRODUCTION','SANDBOX']
        }
    }, {
        classMethods: {
            associate: function (models) {
                Salesforce.belongsTo(models.Locale);
                Salesforce.belongsTo(models.TimeZone);
            }
        }
    });
    
    return Salesforce;  
};