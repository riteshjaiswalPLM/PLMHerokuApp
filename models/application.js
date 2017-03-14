var fs              = require('fs');
var path            = require('path');

module.exports = function(sequelize, DataTypes){
    var Application = sequelize.define("Application",{
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
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: function(){
                return "Akritiv Enterprise Application";
            }
        },
        logo: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: function () {
                var imageData = fs.readFileSync('./public/resources/images/logo/akritiv.png', {root: path.join(__dirname)}).toString("base64");
                return imageData;
            }
        },
        sfdc_username: {
            type: DataTypes.STRING,
            allowNull: true
        },
        sfdc_password: {
            type: DataTypes.STRING,
            allowNull: true
        },
        sfdc_token: {
            type: DataTypes.STRING,
            allowNull: true
        }
        // sfdc_username: {
        //     type: DataTypes.STRING,
        //     allowNull: true
        // },
        // sfdc_password: {
        //     type: DataTypes.STRING,
        //     allowNull: true
        // },
        // sfdc_token: {
        //     type: DataTypes.STRING,
        //     allowNull: true
        // },
        // sfdc_environment: {
        //     type: DataTypes.ENUM,
        //     allowNull: true,
        //     values: ['PRODUCTION','SANDBOX']
        // }
    });
    
    // Application.sync().then(function(){
    //     var count = Application.findAll({
    //         attributes: [[sequelize.fn('COUNT',sequelize.col('id')), 'row_count']]
    //     });
    //     count.then(function(result){
    //         var rowCount = result[0].get('row_count');
    //         console.log('row_count : ' +  rowCount);
    //         if(rowCount == 0){
    //             Application.build({
    //                 sfdc_username: null,
    //                 sfdc_password: null,
    //                 sfdc_token: null
    //             }).save().then(function(application){
    //                 fs.writeFileSync(path.join(__dirname) + '/../public/resources/images/logo/application.png', application.logo ,"base64");
    //             }).catch(function(error){
    //                 console.error(error);
    //             });
    //         }
    //     });
    // });
    
    return Application;  
};