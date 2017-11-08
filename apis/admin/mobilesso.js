var express = require('express');
var mobileSSORouter = express.Router();

mobileSSORouter.post('/ssoconfig', function(req, res){
    var instanceUrl = process.env.INSTANCE_URL || 'http://localhost:3000';
     return res.json({
        success: true,
        data: {
            ssoConfig: global.ssoconfig.mobile.config,
            callbackUrl:instanceUrl+"/api/sso/mobile/callback"
        }
    });
    
});

mobileSSORouter.post('/ssoconfig/save', function(req, res){
    var ssoConfig = req.body;
    if(ssoConfig.id==undefined){
        db.SSOConfig.findOrCreate({
            where: {
                forMobile: true
            },
            defaults: {
                active: ssoConfig.active,
                entryPoint: ssoConfig.entryPoint,
                cert: ssoConfig.cert,
                signatureAlgorithm: ssoConfig.signatureAlgorithm,
                authnRequestBinding: ssoConfig.authnRequestBinding,
                issuer: ssoConfig.issuer,
                identifierFormat: ssoConfig.identifierFormat,
                linkCaption: ssoConfig.linkCaption,
                mappingConfig: ssoConfig.mappingConfig,
                forMobile:true
            }

        }).spread(function (archivalSetupDetail, created) {
            global.ssoconfig.mobile.refreshSSOConfig(function(updatedConfig){
                return res.json({
                    success: true,
                    data: {
                        ssoConfig: updatedConfig
                    }
                });
            });
        });
    }
    else{
        db.SSOConfig.update({
            active: ssoConfig.active,
            entryPoint: ssoConfig.entryPoint,
            cert: ssoConfig.cert,
            signatureAlgorithm: ssoConfig.signatureAlgorithm,
            authnRequestBinding: ssoConfig.authnRequestBinding,
            issuer: ssoConfig.issuer,
            identifierFormat: ssoConfig.identifierFormat,
            linkCaption: ssoConfig.linkCaption,
            mappingConfig: ssoConfig.mappingConfig
        },{
            where: {
                id: ssoConfig.id
            },
        }).then(function(){
            global.ssoconfig.mobile.refreshSSOConfig(function(updatedConfig){
                return res.json({
                    success: true,
                    data: {
                        ssoConfig: updatedConfig
                    }
                });
            });
            
        });
    }
});

module.exports = mobileSSORouter;