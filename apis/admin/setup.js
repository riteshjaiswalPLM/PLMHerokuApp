var express = require('express');
var setupRouter = express.Router();
var jsForce = require('jsforce');

setupRouter.post('/sfdc', function(req, res){
    var Sfdcs = db.Salesforce.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        include: [{
            model: db.TimeZone,
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        },{
            model: db.Locale,
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        }]
    });
    
    Sfdcs.then(function(sfdcs) {
        if(sfdcs === undefined || sfdcs === null){
            return res.json({
                success: false,
                message: 'Error occured while loading salesforce org configuration.'
            });
        }else{
            return res.json({
                success: true,
                data: {
                    sfdc: sfdcs[0],
                    orgId: global.sfdc.orgId,
                    locale: locale.list,
                    timezone: timezone.list
                }
            });
        }
    });
});

setupRouter.post('/sfdc/remove', function(req, res){
    var Sfdcs = db.Salesforce.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        }
    });
    
    Sfdcs.then(function(sfdcs) {
        if(sfdcs === undefined || sfdcs === null){
            return res.json({
                success: false,
                message: 'Error occured while loading salesforce org configuration.'
            });
        }else{
            db.Salesforce.update({
                username: null,
                password: null,
                token: null,
                environment: null
            },{
                where: {
                    id: sfdcs[0].id
                }
            }).spread(function(affectedCount, affectedRows){
                console.log('affectedCount :: ' + affectedCount);
                console.log('affectedRows :: ' + affectedRows);
                if(affectedCount > 0){
                    global.sfdc.getConnection(function(err, connection){
                        if(err){
                            return res.json({
                                success: false,
                                message: 'Error occured while validating current salesforce org configuration.'
                            });
                        }else{
                            connection.logout(function(err){
                                if(err){
                                    return res.json({
                                        success: false,
                                        message: 'Error occured while removing salesforce org configuration.'
                                    });
                                }else{
                                    global.sfdc.orgId = null;
                                    return res.json({
                                        success: true,
                                        affectedCount: affectedCount,
                                        affectedRows: affectedRows,
                                    });
                                }
                            });
                        }
                    });
                }else{
                    return res.json({
                        success: false,
                        message: 'Error occured while removing salesforce org configuration.'
                    });
                }
            });
        }
    });
});

setupRouter.post('/sfdc/save', function(req, res){
    var sfdcConfig = req.body;

    console.log(sfdcConfig);
    var jsForceConnection = new jsForce.Connection({
        loginUrl: (sfdcConfig.environment === 'SANDBOX') ? 'https://test.salesforce.com' : 'https://login.salesforce.com'
    });
    jsForceConnection.login(sfdcConfig.username,sfdcConfig.password + sfdcConfig.token, function (err, userInfo) {
        if(err){
            console.error(err);
            return res.json({
                success: false,
                message: 'Invalid salesforce credentials!!!',
                error: err
            });
        }else{

            var Sfdcs = db.Salesforce.findAll({
                attributes: {
                    exclude: ['createdAt','updatedAt']
                }
            });
            
            Sfdcs.then(function(sfdcs) {
                if(sfdcs === undefined || sfdcs === null){
                    return res.json({
                        success: false,
                        message: 'Error occured while configuring salesforce org.'
                    });
                }else{
                    db.Salesforce.update({
                        username: sfdcConfig.username,
                        password: sfdcConfig.password,
                        token: sfdcConfig.token,
                        environment: sfdcConfig.environment,
                        LocaleId: sfdcConfig.LocaleId,
                        TimeZoneId: sfdcConfig.TimeZoneId
                    },{
                        where: {
                            id: sfdcs[0].id
                        }
                    }).spread(function(affectedCount, affectedRows){
                        console.log('affectedCount :: ' + affectedCount);
                        console.log('affectedRows :: ' + affectedRows);
                        if(affectedCount > 0){
                            var currentOrgId = global.sfdc.orgId;
                            global.sfdc.setConnection(jsForceConnection,userInfo, function () {
                                return res.json({
                                    success: true,
                                    affectedCount: affectedCount,
                                    affectedRows: affectedRows,
                                    reload: currentOrgId !== userInfo.organizationId
                                });
                            });
                        }else{
                            return res.json({
                                success: false,
                                message: 'Error occured while saving salesforce org configuration.'
                            });
                        }
                    });
                }
            });
        }
    });
});

setupRouter.post('/usermapping', function(req, res){
    var UserMappings = db.UserMapping.findAll({
        attributes: ['id','activeCriteria','syncCriteria','isMobileActive','defaultPWD'],
        include: [{
            model: db.SObject,
            attributes: {
                exclude: ['createdAt','updatedAt']
            },
            include: {
                model: db.SObjectField,
                attributes: {
                    exclude: ['createdAt','updatedAt']
                }
            }
        },{
            model: db.SObjectField,
            as: 'UsernameField',
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        },{
            model: db.SObjectField,
            as: 'FirstnameField',
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        },{
            model: db.SObjectField,
            as: 'LastnameField',
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        },{
            model: db.SObjectField,
            as: 'EmailField',
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        }]
    });
    
    UserMappings.then(function(userMappings) {
        if(userMappings === undefined || userMappings === null){
            return res.json({
                success: false,
                message: 'Error occured while loading user mappings.'
            });
        }else{
            if(userMappings.length === 0){
                return res.json({
                    success: true,
                    data: {
                        userMapping: null
                    }
                });
            }else{
                var userMapping = JSON.parse(JSON.stringify(userMappings[0]));
                db.Role.findOne({
                    attributes: {
                        exclude: ['createdAt','updatedAt']
                    },
                    where: {
                        default: true
                    }
                }).then(function(role) {
                    if(role === undefined || role === null){
                        return res.json({
                            success: false,
                            message: 'Error occured while loading default role with usermapping.'
                        });
                    }else{
                        userMapping.DefaultRole = role;
                        // console.log(role);
                        // console.log(userMapping);
                        return res.json({
                            success: true,
                            data: {
                                userMapping: userMapping
                            }
                        });
                    }
                });
            }
        }
    });
});

setupRouter.post('/usermapping/save', function(req, res){
    var UserMapping = req.body;

    var updateDefaultRole = function(role, callback){
        db.Role.update({default: false},{where:{default: true}}).then(function(){
            db.Role.update({default:true},{where: {id: role.id}}).then(function(){
                callback && callback();
            }).catch(callback);
        }).catch(callback);
    };
    
    var UserMappings = db.UserMapping.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        }
    });
    
    UserMappings.then(function(userMappings) {
        if(userMappings === undefined || userMappings === null){
            return res.json({
                success: false,
                message: 'Error occured while loading user mappings.'
            });
        }else{
            if(userMappings.length === 0){
                // CREATE USER MAPPING
                db.UserMapping.create({
                    SObjectId: UserMapping.SObject.id,
                    UsernameFieldId: UserMapping.UsernameField.id,
                    FirstnameFieldId: UserMapping.FirstnameField.id,
                    LastnameFieldId: UserMapping.LastnameField.id,
                    EmailFieldId: UserMapping.EmailField.id,
                    activeCriteria: UserMapping.activeCriteria,
                    syncCriteria: UserMapping.syncCriteria,
                    isMobileActive: UserMapping.isMobileActive,
                    defaultPWD: UserMapping.defaultPWD
                },{
                    individualHooks: true
                }).then(function(newUserMapping){
                    updateDefaultRole(UserMapping.DefaultRole,function(err){
                        if(err){
                            return res.json({
                                success: false,
                                message: 'Error occured while updating default role.',
                                error: err
                            });
                        }else{
                            return res.json({
                                success: true,
                                data: {
                                    oldUserMapping: null,
                                    newUserMapping: newUserMapping,
                                    userMapping: UserMapping
                                }
                            });
                        }
                    });
                }).catch(function(err){
                    return res.json({
                        success: false,
                        message: 'Error occured while saving user mapping configurations',
                        error: err
                    });
                });
            }else{
                var oldUserMapping = userMappings[0];
                // UPDATE USER MAPPING
                db.UserMapping.update({
                    SObjectId: UserMapping.SObject.id,
                    UsernameFieldId: UserMapping.UsernameField.id,
                    FirstnameFieldId: UserMapping.FirstnameField.id,
                    LastnameFieldId: UserMapping.LastnameField.id,
                    EmailFieldId: UserMapping.EmailField.id,
                    activeCriteria: UserMapping.activeCriteria,
                    syncCriteria: UserMapping.syncCriteria,
                    isMobileActive: UserMapping.isMobileActive,
                    defaultPWD: UserMapping.defaultPWD
                },{
                    where: {
                        id: oldUserMapping.id
                    },
                    individualHooks: true
                }).then(function(){
                    updateDefaultRole(UserMapping.DefaultRole,function(err){
                        if(err){
                            return res.json({
                                success: false,
                                message: 'Error occured while updating default role.',
                                error: err
                            });
                        }else{
                            return res.json({
                                success: true,
                                data: {
                                    oldUserMapping: oldUserMapping,
                                    userMapping: UserMapping
                                }
                            });
                        }
                    });
                }).catch(function(err){
                    return res.json({
                        success: false,
                        message: 'Error occured while updating user mapping configurations',
                        error: err
                    });
                });
            }
        }
    });
});

setupRouter.post('/ssoconfig', function(req, res){
    return res.json({
        success: true,
        data: {
            ssoConfig: global.ssoconfig.config
        }
    });
});

setupRouter.post('/ssoconfig/getuserobjectfields', function(req, res){
    var includeFields = ['firstname','lastname','email','username','faderationId'];
    return res.json({
        success: true,
        data: {
            userTableFields: includeFields
        }
    });
});

setupRouter.post('/ssoconfig/save', function(req, res){
    var ssoConfig = req.body;
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
        }
    }).then(function(){
        global.ssoconfig.refreshSSOConfig(function(updatedConfig){
            return res.json({
                success: true,
                data: {
                    ssoConfig: updatedConfig
                }
            });
        });
    });
});

module.exports = setupRouter;