
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
        }
    },{
        classMethods: {
        }
    });
    
    return Template;
}