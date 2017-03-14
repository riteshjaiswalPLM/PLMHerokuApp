module.exports = function(sequelize, DataTypes){
    var SObject = sequelize.define("SObject",{
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        label: {
            type: DataTypes.STRING,
            allowNull: false
        },
        labelPlural: {
            type: DataTypes.STRING,
            allowNull: false
        },
        keyPrefix: {
            type: DataTypes.STRING,
            allowNull: true
        },
        custom: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        customSetting: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        createable: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        deletable: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        layoutable: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        mergeable: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        queryable: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        replicateable: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        retrieveable: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        updateable: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        forMobile: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: function(){
                return false;
            }
        },
        config: {
            type: DataTypes.TEXT,
            set: function(value){
                this.setDataValue('config',JSON.stringify(value));
            },
            get: function() {
                if(this.getDataValue('config') !== undefined)
                    return JSON.parse(this.getDataValue('config'));
                else
                    this.getDataValue('config');
            }
        }
    },{
        classMethods: {
            associate: function(models){
                SObject.hasMany(models.SObjectField,{
                    onDelete: 'CASCADE',
                    hooks:true
                });
                SObject.hasMany(models.SObjectLayout,{
                    onDelete: 'CASCADE', 
                    hooks:true
                });
                SObject.hasMany(models.Tab,{
                    onDelete: 'CASCADE', 
                    hooks:true
                });
                SObject.hasMany(models.SObjectLookup,{
                    onDelete: 'CASCADE', 
                    hooks:true
                });
            }
        }
    });
    
    return SObject;  
};