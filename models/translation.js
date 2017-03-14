module.exports = function(sequelize, DataTypes){
    var Translation = sequelize.define("Translation",{
        label: {
            type: DataTypes.STRING,
            allowNull: false
        },
        translation: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM,
            values: ['SObject-Label', 'SObject-Section','Fixed-Label']
        }
    },{
        classMethods: {
            associate: function(models){
                Translation.belongsTo(models.Language);
                Translation.belongsTo(models.SObject);
                Translation.belongsTo(models.SObjectLayoutSection);
            }
        }
    });

    return Translation;
};