module.exports = function(sequelize, DataTypes){
    var UserMapping = sequelize.define("UserMapping", {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: function(){
                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                var value = "";
                for( var i=0; i < 18; i++ )
                    value += possible.charAt(Math.floor(Math.random() * possible.length));
                return value;
            }
        },
        activeCriteria: {
            type: DataTypes.TEXT,
            set: function(value){
                this.setDataValue('activeCriteria',JSON.stringify(value));
            },
            get: function() {
                if(this.getDataValue('activeCriteria') === null || this.getDataValue('activeCriteria') === undefined){
                    return {};
                }
                return JSON.parse(this.getDataValue('activeCriteria'));
            },
            defaultValue: function(){
                return {};
            }
        },
        syncCriteria: {
            type: DataTypes.TEXT,
            set: function(value){
                this.setDataValue('syncCriteria',JSON.stringify(value));
            },
            get: function() {
                if(this.getDataValue('syncCriteria') === null || this.getDataValue('syncCriteria') === undefined){
                    return {};
                }
                return JSON.parse(this.getDataValue('syncCriteria'));
            },
            defaultValue: function(){
                return {};
            }
        },
        isMobileActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: function(){
                return false;
            }
        },
        defaultPWD: {
            type: DataTypes.STRING,
            alloallowNull: false,
        },
    },{
        classMethods: {
            associate: function(models){
                UserMapping.belongsTo(models.SObject);
                UserMapping.belongsTo(models.SObjectField, {as: 'UsernameField'});
                UserMapping.belongsTo(models.SObjectField, {as: 'FirstnameField'});
                UserMapping.belongsTo(models.SObjectField, {as: 'LastnameField'});
                UserMapping.belongsTo(models.SObjectField, {as: 'EmailField'});
            }
        },
        hooks: {
            afterCreate: function(userMapping, options){
                console.log('UserMapping :: Hook :: -> AfterCreate()');
                console.log(userMapping);
                global.sfdc.saveAndSubscribeUserSyncTopic(userMapping);
            },
            afterUpdate: function(userMapping, options){
                console.log('UserMapping :: Hook :: -> AfterUpdate()');
                console.log(userMapping);
                global.sfdc.saveAndSubscribeUserSyncTopic(userMapping);
            }
        }
    });
    
    return UserMapping;
}