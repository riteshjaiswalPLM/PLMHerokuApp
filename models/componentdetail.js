module.exports = function(sequelize, DataTypes){
    var ComponentDetail = sequelize.define("ComponentDetail",{
        configuration: {
            type: DataTypes.TEXT,
            set: function(value){
                this.setDataValue('configuration',JSON.stringify(value));
            },
            get: function() {
                return JSON.parse(this.getDataValue('configuration'));
            }
        }
    });
    
    return ComponentDetail;  
};