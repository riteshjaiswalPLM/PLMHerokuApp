var CryptoJS = require('crypto-js');

module.exports = function(sequelize, DataTypes){
    var User = sequelize.define("User", {
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
        firstname: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: function(){
                return 'N/A';
            }
        },
        lastname: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: function(){
                return 'N/A';
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: {
                    msg: 'Invalid email field!'
                }
            }
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            set: function(value){
                var ciphertext = CryptoJS.MD5(value);
                this.setDataValue('password', ciphertext.toString());
            }
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: function(){
                return false;
            }
        },
        userdata: {
            type: DataTypes.TEXT,
            set: function(value){
                this.setDataValue('userdata',JSON.stringify(value));
            },
            get: function() {
                if(this.getDataValue('userdata') === null || this.getDataValue('userdata') === undefined){
                    return {};
                }
                return JSON.parse(JSON.stringify(this.getDataValue('userdata')));
            },
            defaultValue: function(){
                return {};
            }
        },
        changereqdate :{
            type:DataTypes.DATE
        },
        faderationId:{
            type: DataTypes.STRING,
            unique: true
        }
    },{
        classMethods: {
            associate: function(models){
                User.belongsTo(models.Role);
                User.belongsTo(models.Language);
                User.belongsTo(models.Locale);
                User.belongsTo(models.TimeZone);
            }
        }
    });
    
    return User;
}