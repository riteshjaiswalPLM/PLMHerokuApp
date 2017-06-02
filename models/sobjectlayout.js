module.exports = function(sequelize, DataTypes){
    var SObjectLayout = sequelize.define("SObjectLayout",{
        type: {
            type: DataTypes.ENUM,
            values: ['Create','Edit','List','Details','Mobile']
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
        },
        events: {
            type: DataTypes.TEXT,
        	defaultValue: function(){
                return undefined;
            },
            set: function(value){
                this.setDataValue('events',JSON.stringify(value));
            },
            get: function() {
                if(this.getDataValue('events') !== undefined)
                    return JSON.parse(this.getDataValue('events'));
                else
                    this.getDataValue('events');
            }
        },
        btnCriteria: {
            type: DataTypes.TEXT,
        	defaultValue: function(){
                return undefined;
            },
            set: function(value){
                this.setDataValue('btnCriteria',JSON.stringify(value));
            },
            get: function() {
                if(this.getDataValue('btnCriteria') !== undefined)
                    return JSON.parse(this.getDataValue('btnCriteria'));
                else
                    this.getDataValue('btnCriteria');
            }
        },
        whereClause: {
            type: DataTypes.TEXT,
            defaultValue: function () {
                return undefined;
            }
        }
    },{
        classMethods: {
            associate: function(models){
                SObjectLayout.belongsTo(models.SObject);
                
                SObjectLayout.hasMany(models.SObjectLayoutField, {
                    onDelete: 'CASCADE', 
                    hooks: true
                });
                
                SObjectLayout.hasMany(models.SObjectLayoutSection, {
                    onDelete: 'CASCADE', 
                    hooks: true
                });
                
                SObjectLayout.hasMany(models.SObjectLayoutRelatedList, {
                    onDelete: 'CASCADE', 
                    hooks: true
                });

                SObjectLayout.hasMany(models.MobileEditLayoutConfig, {
                    as:'a',
                    onDelete: 'CASCADE', 
                    hooks: true
                });
            }
        }
    });
    
    return SObjectLayout;  
};