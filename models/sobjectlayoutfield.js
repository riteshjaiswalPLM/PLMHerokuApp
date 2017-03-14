module.exports = function(sequelize, DataTypes){
    var SObjectLayoutField = sequelize.define("SObjectLayoutField",{
        label: {
            type: DataTypes.STRING,
            defaultValue: function(){
                return 'Undefined';   
            }  
        },
        type: {
            type: DataTypes.ENUM,
            values: ['Search-Criteria-Field','Search-Result-Field','Layout-Section-Field','Related-List-Field','SObject-Lookup-Field','SObject-Component-Field']
        },
        reference: {
            type: DataTypes.STRING,
            allowNull: true
        },
        hidden: {
            type: DataTypes.BOOLEAN,
            defaultValue: function(){
                return false;
            }
        },
        deleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: function () {
                return false;
            }
        },
        column: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: function(){
                return 0;
            }
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: function(){
                return 0;
            }
        },
        defaultValue: {
            type: DataTypes.STRING
        },
        readonly: {
            type: DataTypes.BOOLEAN,
            defaultValue: function(){
                return false;
            }
        },
        required: {
            type: DataTypes.BOOLEAN,
            defaultValue: function(){
                return false;
            }
        },
        enable: {
            type: DataTypes.BOOLEAN,
            defaultValue: function(){
                return true;
            }
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: function(){
                return true;
            }
        },
        fromfield: {
            type: DataTypes.BOOLEAN,
        },
        tofield: {
            type: DataTypes.BOOLEAN,
        },
        event: {
            type: DataTypes.TEXT,
            defaultValue: function(){
                return undefined;
            },
            set: function(value){
                this.setDataValue('event',JSON.stringify(value));
            },
            get: function() {
                if(this.getDataValue('event') !== undefined)
                    return JSON.parse(this.getDataValue('event'));
                else
                    this.getDataValue('event');
            }
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
                SObjectLayoutField.belongsTo(models.SObjectField);
                SObjectLayoutField.belongsTo(models.SObjectField, {as: 'ControllerSObjectField'});
                SObjectLayoutField.belongsTo(models.SObjectLookup);
                SObjectLayoutField.belongsTo(models.Components);
            }
        }
    });
    
    return SObjectLayoutField;
};