module.exports = function(sequelize, DataTypes){
    var MobileEditLayoutConfig = sequelize.define("MobileEditLayoutConfig",{
        governingFieldValue: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            set: function(value){
                this.setDataValue('governingFieldValue',JSON.stringify(value));
            },
            get: function() {
                if(this.getDataValue('governingFieldValue') !== undefined)
                    return JSON.parse(this.getDataValue('governingFieldValue'));
                else
                    this.getDataValue('governingFieldValue');
            }
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: function(){
                return true;
            }
        }
    },{
        classMethods: {
            associate: function(models){
                MobileEditLayoutConfig.belongsTo(models.SObjectLayout,{
                    onDelete: 'CASCADE',
                    hooks:true
                });

                MobileEditLayoutConfig.hasMany(models.SObjectLayoutSection, {
                    onDelete: 'CASCADE', 
                    hooks: true
                });

                MobileEditLayoutConfig.hasMany(models.SObjectLayoutRelatedList, {
                    onDelete: 'CASCADE', 
                    hooks: true
                });
            }
        }
    });

    return MobileEditLayoutConfig;
};