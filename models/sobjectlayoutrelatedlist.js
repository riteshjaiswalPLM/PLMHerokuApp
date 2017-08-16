module.exports = function(sequelize, DataTypes){
    var SObjectLayoutRelatedList = sequelize.define("SObjectLayoutRelatedList",{
        title: {
            type: DataTypes.STRING,
            defaultValue: function(){
                return 'Untitled related list';
            }
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
        dispaySection: {
            type: DataTypes.STRING,
         
        },
        whereClause: {
            type: DataTypes.TEXT,
         
        },
        groupBy: {
            type: DataTypes.TEXT,
         
        },
        orderBy: {
            type: DataTypes.TEXT,
         
        },
        criteria :{
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
        },
        requireAddMore: {
            type: DataTypes.BOOLEAN,
            defaultValue: function(){
                return false;
            }
        },
        amountCriteriaConfig: {
            type: DataTypes.TEXT,
            defaultValue: function () {
                return undefined;
            },
            set: function (value) {
                this.setDataValue('amountCriteriaConfig', JSON.stringify(value));
            },
            get: function () {
                if (this.getDataValue('amountCriteriaConfig') !== undefined)
                    return JSON.parse(this.getDataValue('amountCriteriaConfig'));
                else
                    this.getDataValue('amountCriteriaConfig');
            }
        }
    },{
        classMethods: {
            associate: function(models){
                SObjectLayoutRelatedList.belongsTo(models.SObject);
                SObjectLayoutRelatedList.belongsTo(models.SObjectField);
                
                SObjectLayoutRelatedList.hasMany(models.SObjectLayoutField, {
                    onDelete: 'CASCADE',
                    hooks: true
                });

                SObjectLayoutRelatedList.belongsTo(models.MobileEditLayoutConfig, {
                    onDelete: 'CASCADE', 
                    hooks: true
                });
            }
        }
    });
    
    return SObjectLayoutRelatedList;
};