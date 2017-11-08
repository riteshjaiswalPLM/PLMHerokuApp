ssoconfig = {};
ssoconfig.config = {};
ssoconfig.refreshSSOConfig = (callback)=>{
    ssoconfig.config = {};
    var SSOConfigs = db.SSOConfig.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: {
            forMobile: false
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

ssoconfig.mobile={};
ssoconfig.mobile.config = {};
ssoconfig.mobile.refreshSSOConfig = (callback)=>{
    ssoconfig.mobile.config = {};
    var SSOConfigs = db.SSOConfig.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: {
            forMobile: true
        }
    });

    SSOConfigs.then(function(SSOConfigs) {
        if(SSOConfigs.length > 0){
            ssoconfig.mobile.config = SSOConfigs[0];
        }
        callback && callback(ssoconfig.mobile.config)
    });
}
ssoconfig.mobile.refreshSSOConfig();
module.exports = ssoconfig;