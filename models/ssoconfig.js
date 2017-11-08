module.exports = function(sequelize, DataTypes){
    var SSOConfig = sequelize.define("SSOConfig",{
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: function(){
                return false;
            }
        },
        entryPoint: {
            type: DataTypes.TEXT,
        	defaultValue: function(){
                return undefined;
            }
        },
        cert: {
            type: DataTypes.TEXT,
        	defaultValue: function(){
                return undefined;
            }
        },
        signatureAlgorithm: {
            type: DataTypes.ENUM,
            values: ['sha1','sha256']
        },
        authnRequestBinding: {
            type: DataTypes.ENUM,
            values: ['HTTP-POST','HTTP-Redirect']
        },
        issuer:{
            type: DataTypes.STRING
        },
        identifierFormat: {
            type: DataTypes.STRING
        },
        linkCaption: {
            type: DataTypes.STRING
        },
        forMobile: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: function(){
                return false;
            }
        },
        mappingConfig: {
            type: DataTypes.TEXT,
        	defaultValue: function(){
                return undefined;
            },
            set: function(value){
                this.setDataValue('mappingConfig',JSON.stringify(value));
            },
            get: function() {
                if(this.getDataValue('mappingConfig') !== undefined)
                    return JSON.parse(this.getDataValue('mappingConfig'));
                else
                    this.getDataValue('mappingConfig');
            }
        }
    });
    
    return SSOConfig;  
};