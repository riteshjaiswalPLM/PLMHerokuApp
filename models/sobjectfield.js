module.exports = function(sequelize, DataTypes){
    var SObjectField = sequelize.define("SObjectField",{
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        label: {
            type: DataTypes.STRING,
            allowNull: false
        },
        custom: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        aggregatable: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        autoNumber: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        byteLength: {
            type: DataTypes.INTEGER
        },
        calculated: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        calculatedFormula: {
            type: DataTypes.TEXT
        },
        controllerName: {
            type: DataTypes.STRING
        },
        createable: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        defaultValue: {
            type: DataTypes.STRING
        },
        defaultValueFormula: {
            type: DataTypes.STRING
        },
        dependentPicklist: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        digits: {
            type: DataTypes.INTEGER
        },
        encrypted: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        externalId: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        extraTypeInfo: {
            type: DataTypes.STRING
        },
        filterable: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        highScaleNumber: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        htmlFormatted: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        idLookup: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        inlineHelpText: {
            type: DataTypes.STRING
        },
        length: {
            type: DataTypes.INTEGER
        },
        mask: {
            type: DataTypes.STRING
        },
        maskType: {
            type: DataTypes.STRING
        },
        nameField: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        namePointing: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        nillable: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        picklistValues: {
            type: DataTypes.TEXT,
            set: function(value){
                this.setDataValue('picklistValues',JSON.stringify(value));
            },
            get: function() {
                if(this.getDataValue('picklistValues') !== undefined)
                    return JSON.parse(this.getDataValue('picklistValues'));
                else
                    this.getDataValue('picklistValues');
            }
        },
        precision: {
            type: DataTypes.INTEGER
        },
        referenceTargetField: {
            type: DataTypes.STRING
        },
        referenceTo: {
            type: DataTypes.TEXT,
            set: function(value){
                this.setDataValue('referenceTo',JSON.stringify(value));
            },
            get: function() {
                if(this.getDataValue('referenceTo') !== undefined)
                    return JSON.parse(this.getDataValue('referenceTo'));
                else
                    this.getDataValue('referenceTo');
            }
        },
        relationshipName: {
            type: DataTypes.STRING
        },
        restrictedDelete: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        restrictedPicklist: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        scale: {
            type: DataTypes.INTEGER
        },
        sortable: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING
        },
        unique: {
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
        isGovernField: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: function(){
                return false;
            }
        }
    },{
        classMethods: {
            associate: function(models){
                SObjectField.belongsTo(models.SObject);
            }
        }
    });
    
    return SObjectField;  
};