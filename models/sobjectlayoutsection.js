module.exports = function(sequelize, DataTypes){
    var SObjectLayoutSection = sequelize.define("SObjectLayoutSection",{
        title: {
            type: DataTypes.STRING,
            defaultValue: function(){
                return 'Untitled section';
            }
        },
        columns: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: function(){
                return 0;
            }
        },
        deleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: function () {
                return false;
            }
        },
        readonly: {
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
        isComponent: {
            type: DataTypes.BOOLEAN,
            defaultValue: function(){
                return false;
            }
        },
        componentName: {
            type: DataTypes.STRING
        },
        criteria: {
            type: DataTypes.TEXT,
            defaultValue: function(){
                return undefined;
            },
            set: function(value){
                this.setDataValue('criteria',JSON.stringify(value));
            },
            get: function() {
                if(this.getDataValue('criteria') !== undefined)
                    return JSON.parse(this.getDataValue('criteria'));
                else
                    this.getDataValue('criteria');
            }
        }
    },{
        classMethods: {
            associate: function(models){
                SObjectLayoutSection.hasMany(models.SObjectLayoutField, {
                    onDelete: 'CASCADE', 
                    hooks: true
                });
                SObjectLayoutSection.belongsTo(models.Components);
                SObjectLayoutSection.belongsTo(models.MobileEditLayoutConfig, {
                    onDelete: 'CASCADE', 
                    hooks: true
                });
            }
        }
    });
    
    return SObjectLayoutSection;  
};