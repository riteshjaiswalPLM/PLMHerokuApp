var fs = require('fs');
var path = require('path');

module.exports = {
    sync: function(models, callback){
        var Application = models.Application;
        
        Application.sync().then(function(){
            Application.count().then(function(rowCount){
                if(rowCount == 0){
                    Application.build({
                        title: "Akritiv Enterprise Application"
                        // sfdc_username: null,
                        // sfdc_password: null,
                        // sfdc_token: null,
                        // sfdc_environment: null
                    }).save().then(function(application){
                        fs.writeFileSync(path.join(__dirname) + '/../../public/resources/images/logo/application.png', application.logo ,"base64");
                        callback && callback();
                    }).catch(function(error){
                        console.error(error);
                        callback && callback(error);
                    });
                }else{
                    callback && callback();
                }
            });
        });
    }
}