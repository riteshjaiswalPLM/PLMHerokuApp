module.exports = {
    sync: function(models, callback){
        var SSOConfig = models.SSOConfig;
        
        SSOConfig.sync().then(function(){
            SSOConfig.count().then(function(SSOConfigCount){
                if(SSOConfigCount === 0){
                    SSOConfig.bulkCreate([
                        { active: false }
                    ]).then(function(){
                        console.log("SSO Config created successfully!");
                        callback && callback();
                    });
                }else{
                    callback && callback();
                }
            });
        });
    }
};