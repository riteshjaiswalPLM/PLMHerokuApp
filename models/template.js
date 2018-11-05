
module.exports = function(sequelize, DataTypes){
    var Template = sequelize.define("Template", {
        utilityname: {
            type: DataTypes.STRING,
            allowNull: false,

        },
        subject: {
            type: DataTypes.TEXT,
            defaultValue: function(){
                return 'N/A';
            }
        },
        body: {
            type: DataTypes.TEXT,
            defaultValue: function(){
                return 'N/A';
            }
        },
        emailtype: {
            type: DataTypes.ENUM,
            values: ['html','text']
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: function () {
                return false;
            }
        },
    },{
            classMethods: {
                associate: function (models) {
                    Template.belongsTo(models.Language);
                }
            }
        });

    return Template;
}