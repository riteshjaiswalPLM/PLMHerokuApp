
module.exports = {
    sync: function(models, callback){
        var Salesforce = models.Salesforce;
        var sfdc = global.config.sfdc;
        
        Salesforce.sync().then(function(){
            Salesforce.count().then(function(rowCount){
                if(rowCount == 0){
                    Salesforce.build({
                        username: (process.env.DATABASE_URL) ? process.env.SFDC_USERNAME : sfdc.username,
                        password: (process.env.DATABASE_URL) ? process.env.SFDC_PASSWORD : sfdc.password,
                        token: (process.env.DATABASE_URL) ? process.env.SFDC_TOKEN : sfdc.token,
                        environment: (process.env.DATABASE_URL) ? process.env.SFDC_ENVIRONMENT : sfdc.environment
                    }).save().then(function(salesforce){
                        callback && callback();
                    }).catch(function(error){
                        callback && callback(error);
                    });
                }else{
                    callback && callback();
                }
            });
        });
    }
}