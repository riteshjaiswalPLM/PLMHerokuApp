ssoconfig = {};
ssoconfig.config = {};
ssoconfig.refreshSSOConfig = (callback)=>{
    ssoconfig.config = {};
    var SSOConfigs = db.SSOConfig.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        }
    });

    SSOConfigs.then(function(SSOConfigs) {
        if(SSOConfigs.length > 0){
            ssoconfig.config = SSOConfigs[0];
        }
        callback && callback(ssoconfig.config)
    });
}
ssoconfig.refreshSSOConfig();
module.exports = ssoconfig;