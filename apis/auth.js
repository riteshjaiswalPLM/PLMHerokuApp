var express = require('express');
var jwt = require('jsonwebtoken');
var CryptoJS = require('crypto-js');
var authRouter = express.Router();
var request = require('request');

global.authenticate = (credential, where, isSSOLogin, callback)=>{
    if(isSSOLogin == false && !credential.username && !credential.password){
        callback && callback({
            success: false,
            message: message.auth.error.USERNAME_PASSWORD_MISSING
        });
    }
    
    if(!isSSOLogin){
        var ciphertext = CryptoJS.MD5(credential.password);
        credential.password = ciphertext.toString();
    }
    
    var User = db.User.findOne({
        include: [{
            model: db.Role,
            attributes: {
                exclude: ['id','createdAt','updatedAt','system']
            }
        },{
            model: db.Language,
            attributes: ['id','name','code']
        },{
            model: db.TimeZone,
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        },{
            model: db.Locale,
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        }],
        attributes: {
            exclude: ['createdAt','updatedAt','RoleId','active','LanguageId']
        },
        where: where
    });
    
    User.then(function(user){
        if((user == null || !user) || (isSSOLogin == false && user.password != credential.password)){
            callback && callback({
                success: false,
                isSSOLogin: isSSOLogin,
                message: message.auth.error.INVALID_CREDENTIALS
            });
        } else {
            var token = jwt.sign({
                id: user.id,
                username: user.username,
                role: user.Role.name
            }, config.constant.SECRET_KEY, {
                expiresIn: 1440 * 60
            });
            
            var clonedUser = JSON.parse(JSON.stringify(user));
            var Role = clonedUser.Role.name;
            clonedUser.homeTemplateUrl = (clonedUser.Role.name === 'ADMINISTRATOR') ? 'views/admin.html' : 'views/home.html';
            if(clonedUser.Role.name === 'ADMINISTRATOR'){
                clonedUser.isAdmin = true;
            }
            var translation = {};
            clonedUser.Language = clonedUser.Language;
            if(clonedUser.Role.name !== 'ADMINISTRATOR')
                translation[clonedUser.Language.code] = global.config.languageconfig.languageconfig.languageTransaltionMap[clonedUser.Language.code];
            
            delete clonedUser.password;
            delete clonedUser.id;
            delete clonedUser.Role;
            
            if(!clonedUser.isAdmin){
                if(clonedUser.Locale === undefined && global.salesforce.config.Locale !== undefined) clonedUser.Locale = JSON.parse(JSON.stringify(global.salesforce.config.Locale));
                if(clonedUser.TimeZone === undefined && global.salesforce.config.TimeZone !== undefined) clonedUser.TimeZone = JSON.parse(JSON.stringify(global.salesforce.config.TimeZone));
                callback && callback({
                    success: true,
                    isSSOLogin: isSSOLogin,
                    message: message.auth.success.AUTHENTICATION_SUCCESS,
                    token: token,
                    user: clonedUser,
                    translation: translation
                });
            }
            else{
                callback && callback({
                    success: true,
                    isSSOLogin: isSSOLogin,
                    message: message.auth.success.AUTHENTICATION_SUCCESS,
                    token: token,
                    user: clonedUser
                });
            }
        }
    });
};

authRouter.post('/authenticate', function(req, res){
    global.authenticate({
        username: req.body.username, 
        password: req.body.password
    },{
        username: req.body.username,
        active: true
    }, req.body.isSSOLogin ? req.body.isSSOLogin : false, function(response){
        return res.json(response);
    });
});

authRouter.post('/states', function(req, res){
    var user = req.body;
    var viewPrefix = (user.viewPrefix != null && user.viewPrefix != undefined && user.viewPrefix.trim() != '') ? user.viewPrefix : '';
    console.log(user);
    
    var User = db.User.findOne({
        include: {
            model: db.Role,
            attributes: {
                exclude: ['id','createdAt','updatedAt','system']
            }
        },
        attributes: {
            exclude: ['createdAt','updatedAt','RoleId','active']
        },
        where: {
            username: user.username,
            active: true
        }
    });
    
    User.then(function(user){
        if(user === null || user === undefined){
            return res.json({
                success: false,
                message: 'Invalid user data!'
            });
        }else{
            if(user.Role.name !== 'ADMINISTRATOR'){
                var Tabs = db.Tab.findAll({
                    include: [{
                        model: db.SObject,
                        attributes: {
                            exclude: ['createdAt','updatedAt']
                        },
                        include: [{
                            model: db.SObjectLayout,
                            as: 'SObjectLayouts',
                            attributes: {
                                exclude: ['createdAt','updatedAt']
                            },
                            where: {
                                created: true,
                                active: true,
                                type : {
                                    $ne : 'Mobile'
                                }
                            }
                        }]
                    },{
                        model: db.Icon,
                        attributes: {
                            exclude: ['createdAt','updatedAt']
                        }
                    }],
                    attributes: {
                        exclude: ['createdAt','updatedAt']
                    },
                    order: [
                        ['order']
                    ],
                    where: {
                        active: true,
                        created: true
                    }
                }).then(function(tabs) {
                    var states = [], profile = [];
                    if(global.config.dashboardConfig.active){
                        states.push({
                            dynamic: true,
                            name: 'client.dashboard',
                            controller: 'ClientDashboardController',
                            templateUrl: viewPrefix + 'views/client/dashboard.html',
                            title: global.config.dashboardConfig.title,
                            params:{
                                icon: global.config.dashboardConfig[viewPrefix.substring(0, viewPrefix.length - 1)+'icon'],
                                showRefreshResult: global.config.dashboardConfig.showRefreshResult
                            },
                            tab:{
                                label: global.config.dashboardConfig.tabLabel,
                                icon: (global.config.dashboardConfig[viewPrefix.substring(0, viewPrefix.length - 1)+'tabICON']) ? global.config.dashboardConfig[viewPrefix.substring(0, viewPrefix.length - 1)+'tabICON'] : null,
                            }
                        });
                    }
                    tabs.forEach(function(tab){
                        if(tab.SObject.SObjectLayouts !== null && tab.SObject.SObjectLayouts !== undefined){
                            tab.SObject.SObjectLayouts.forEach(function(layout){
                                var stateName = 'client.' + tab.SObject.keyPrefix + '.' + layout.type.toLowerCase();
                                var controllerName = 'Client' + layout.type + 'LayoutController';
                                if(layout.default){
                                    states.push({
                                        dynamic: true,
                                        name: 'client.' + tab.SObject.keyPrefix,
                                        controller: 'ClientLayoutController',
                                        templateUrl: viewPrefix + 'views/client/layout/index.html',
                                        params:{
                                            metadata: {
                                                redirectTo: stateName
                                            }
                                        },
                                        tab:{
                                            label: tab.label,
                                            icon: (tab.Icon) ? tab.Icon.class : null,
                                            keyPrefix: tab.SObject.keyPrefix,
                                            id: tab.id
                                        }
                                    });
                                }
                                states.push({
                                    dynamic: true,
                                    name: stateName,
                                    controller: controllerName,
                                    templateUrl: viewPrefix + 'views/client/layout/'+layout.type.toLowerCase()+'.html',
                                    parentTab:{
                                        label: tab.label,
                                        icon: (tab.Icon) ? tab.Icon.class : null,
                                        keyPrefix: tab.SObject.keyPrefix,
                                        id: tab.id
                                    },
                                    params:{
                                        metadata: {
                                            sobject: {
                                                id: tab.SObject.id,
                                                name: tab.SObject.name
                                            },  
                                            layout: {
                                                id: layout.id,
                                                type: layout.type
                                            }
                                        },
                                        data: null
                                    },
                                    title: (layout.type === 'List') ? tab.SObject.labelPlural : (layout.type === 'Details') ? tab.SObject.label  + ' ' + layout.type  : layout.type + ' ' + tab.SObject.label
                                });
                            });
                        }
                        
                    });
                    if(global.config.archivalConfig.active){
                        states.push({
                            dynamic: true,
                            name: 'client.archival',
                            controller: 'ClientArchivalController',
                            templateUrl: viewPrefix + 'views/client/archival.html',
                            title: global.config.archivalConfig.title,
                            params:{
                                icon: global.config.archivalConfig[viewPrefix.substring(0, viewPrefix.length - 1)+'icon'],
                                showRefreshResult: global.config.archivalConfig.showRefreshResult
                            },
                            tab:{
                                label: global.config.archivalConfig.tabLabel,
                                icon: (global.config.archivalConfig[viewPrefix.substring(0, viewPrefix.length - 1)+'tabICON']) ? global.config.archivalConfig[viewPrefix.substring(0, viewPrefix.length - 1)+'tabICON'] : null,
                            }
                        });
                    }
                    var where = {};
                    var UserMapping = db.UserMapping.findAll({
                        attributes: {
                            exclude: ['createdAt','updatedAt']
                        },
                        order: [
                            ['id']
                        ]
                    });
                    UserMapping.then(function(userMapping){
                        if(userMapping && userMapping.length > 0){
                            where.SObjectId = userMapping[0].SObjectId;
                            where.type = 'Edit';
                            var SObjectLayout = db.SObjectLayout.findAll({
                                include: [{
                                    model: db.SObject,
                                    attributes: {
                                        exclude: ['createdAt','updatedAt']
                                    }
                                }],
                                attributes: {
                                    exclude: ['createdAt','updatedAt']
                                },
                                where: (where) ? where : null,
                                order: [
                                    ['id']
                                ]
                            });
                            SObjectLayout.then(function(sObjectLayout) {
                                if(sObjectLayout === undefined || sObjectLayout === null || (sObjectLayout === undefined && sObjectLayout.length === 0) || (sObjectLayout === null && sObjectLayout.length === 0)){
                                    return res.json({
                                        success: true,
                                        data: {
                                            states: states
                                        }
                                    });
                                }else{
                                    profile.push({
                                        dynamic: true,
                                        name: 'client.profile',
                                        controller: 'ClientProfileController',
                                        templateUrl: viewPrefix + 'views/client/profile/index.html',
                                        params:{
                                            metadata: {
                                                sobject: {
                                                    id: sObjectLayout[0].SObject.id,
                                                    name: sObjectLayout[0].SObject.name
                                                },  
                                                layout: {
                                                    id: sObjectLayout[0].id,
                                                    type: sObjectLayout[0].type
                                                },
                                                redirectTo: 'client'
                                            },
                                            data: null
                                        },
                                        title: 'Profile'
                                    });
                                    return res.json({
                                        success: true,
                                        data: {
                                            states: states,
                                            profile: profile
                                        }
                                    });
                                }
                            });
                        }
                        else{
                            return res.json({
                                success: true,
                                data: {
                                    states: states
                                }
                            });
                        }
                    });
                });
            }else{
                return res.json({
                    success: true,
                    user: user
                });
            }
        }
    });
});

authRouter.post('/mailresetpasswordlink', function(req, res){
    var user = req.body;
    
    var User = db.User.findOne({
        include: {
            model: db.Role,
            attributes: {
                exclude: ['id','createdAt','updatedAt','system']
            }
        },
        attributes: {
            exclude: ['createdAt','updatedAt','RoleId','active','password']
        },
        where: {
            username: user.username,
            active: true
        }
    });
    
    User.then(function(user){
        if(user === null || user === undefined){
            return res.json({
                success: true,
                message: message.auth.success.RESETPASSWORD_SUCCESS,
            });
        }else{
            
                var listToBeInserted=[];
                var base64encode=new Buffer(user.id,'UTF-8');
                
                var link=req.protocol + '://' + req.get('host')+"/resetpassword/"+escape(base64encode.toString('base64'));
             
                console.log('Link escape : '+link);
                
                //  update changereqdate
                db.User.update({
                    changereqdate:new Date().getTime()
                },{
                    where: {
                        id		: user.id,
                        username: user.username,
                        active	: true
                    }
                }).then(function(){

                    //mail sending 
                    var transporter=mailconfig.mailsender;

                    var templateData={
                        username:user.username,
                        link:link
                    };
                    
                    transporter.getTemplate('reset-password',templateData,function(res){

                            if(res.success==false){
                                console.log('Error in sent reset password mail : '+res.message);
                            }
                            else
                            {   
                                var data=res.data; 
                                // setup e-mail data with unicode symbols
                                var mailOptions = {
                                    from: transporter.emailId, // sender address
                                    to: user.email, // list of receivers
                                    subject: data.subject, // Subject line
                                    //text: 'Hello world ?', // plaintext body
                                    //html: emailBody // html body
                                };
                                mailOptions[data.emailtype]=data.body;
                                
                                // send mail with defined transport object
                                transporter.sendMail(mailOptions, function(error, info){
                                    if(error){
                                        console.log('Error in sent reset password mail '+error);
                                    }
                                    console.log('Message sent: ' + info.response);
                                }); 
                            }
                    });
                    return res.json({
                        success: true,
                        message: message.auth.success.RESETPASSWORD_SUCCESS,
                    }); 
                })
                .catch(function(err){
                    console.log(err);
                    return res.json({
                        success: false,
                        message: 'Error occured while sending reset password link.',
                        error: err
                    });
                }); 
                
             
                /*
                // insert data in salesforce tempObject
                var tempSobjectDetail=undefined;
                var LinkFieldName='';
                var EmailFieldName='';
                var UsernameFieldName='';
                var RestpasswordFieldName='';
                var KeyFieldName='';
                
                
                var SObjects = global.db.SObject.findAll({
                        include: {
                            model: db.SObjectField,
                            attributes: {
                                exclude: ['createdAt','updatedAt']
                            }
                        },
                        attributes: {
                            exclude: ['createdAt','updatedAt']
                        }
                    });
                
                SObjects.then(function(sObjects) {
                    if(sObjects === undefined || SObjects === null){
                        return res.json({
                            success: false,
                            message: 'Error occured while sending reset password link.'
                        });
                    }else{
                        
                        sObjects.forEach(function(sObjectData){
                            if(sObjectData.name.indexOf('Temp_Object_Holders__c') != -1){
                                tempSobjectDetail=sObjectData;
                            }
                        });

                        if(tempSobjectDetail === undefined ){
                            return res.json({
                                success: false,
                                message: 'Error occured while sending reset password link.'
                            });
                        }

                        tempSobjectDetail.SObjectFields.forEach(function(sObjectFieldsData){
                            if(sObjectFieldsData.name.indexOf('User_Name__c') != -1){
                                    UsernameFieldName=sObjectFieldsData.name;
                            }
                            else if(sObjectFieldsData.name.indexOf('Reset_Password__c') != -1){
                                    RestpasswordFieldName=sObjectFieldsData.name;
                            }
                            else if(sObjectFieldsData.name.indexOf('Email__c') != -1){
                                    EmailFieldName=sObjectFieldsData.name;
                            }
                            else if(sObjectFieldsData.name.indexOf('ResetLink__c') != -1){
                                    LinkFieldName=sObjectFieldsData.name;
                            }
                            else if(sObjectFieldsData.name.indexOf('Key__c') != -1){
                                    KeyFieldName=sObjectFieldsData.name;
                            }
                        });
                        listToBeInserted[0]={};
                        listToBeInserted[0]['Name']					='Change Password Request';			
                        listToBeInserted[0][UsernameFieldName]		=user.username;
                        listToBeInserted[0][RestpasswordFieldName]	=true;
                        listToBeInserted[0][EmailFieldName]			=user.email;
                        listToBeInserted[0][LinkFieldName]			=link;
                        listToBeInserted[0][KeyFieldName]			=base64encode.toString('base64');
                        
                        console.log('listToBeInserted '+JSON.stringify(listToBeInserted));

                        global.sfdc.sobject(tempSobjectDetail.name).create(listToBeInserted, function(err, ret) {
                            if(err){
                                return res.json({
                                    success: false,
                                    message: 'Error occured while sending reset password link.'
                                });
                            }

                            // update changereqdate
                            db.User.update({
                                    changereqdate:new Date().getTime()
                                },{
                                    where: {
                                        id		: user.id,
                                        username: user.username,
                                        active	: true
                                    }
                                }).then(function(){
                                    return res.json({
                                        success: true,
                                        message: message.auth.success.RESETPASSWORD_SUCCESS,
                                    }); 
                                })
                                .catch(function(err){
                                    console.log(err);
                                    return res.json({
                                        success: false,
                                        message: 'Error occured while sending reset password link.',
                                        error: err
                                    });
                                });
                    
                        });
                    }
                });
                */
        }
    });
});

authRouter.post('/resetpassword', function(req, res){
    var data = req.body;
    var userId;
    var newpassword;
    var baseURL = process.env.MOBILE_AUTH_INSTANCE_URL || 'https://esm-mob-auth-v3.herokuapp.com';
    var base64decode = new Buffer(data.id,'base64');
    userId=base64decode.toString('UTF-8')

    var User = db.User.findOne({
        include: {
            model: db.Role,
            attributes: {
                exclude: ['id','createdAt','updatedAt','system']
            }
        },
        attributes: {
            exclude: ['createdAt','updatedAt','RoleId','active','password']
        },
        where: {
            id : userId,
            active: true
        }
    });
    
    User.then(function(user){
        if(user === null || user === undefined){
            return res.json({
                success: false,
                message: 'Error occured while reseting password',
            });
        }else{
            // link expired validation
            var keytime=user.changereqdate;

            // console.log('linkEXPIRED '+(new Date()-keytime) > (parseInt(config.constant.RESET_PASSWORD_LINK_EXPIRED_HOURS) * (60*60*1000)));
            if( keytime === null || (new Date().getTime()-keytime) > (parseInt(config.constant.RESET_PASSWORD_LINK_EXPIRED_HOURS) * (60*60*1000))){
                return res.json({
                        success: false,
                        message: message.auth.error.LINK_EXPIRED
                });
            }
            
            db.User.update({
                    password        :data.password,
                    changereqdate   :null
                },{
                    where: {
                        id		: userId,
                        username: user.username,
                        active	: true
                    }
                }).then(function(){
                    var UserMapping = db.UserMapping.findAll({
                        attributes: {
                            exclude: ['createdAt','updatedAt']
                        },
                        order: [
                            ['id']
                        ]
                    });
                    UserMapping.then(function(userMapping){
                        //console.log('usermappingdata ',userMapping)
                        if(userMapping && userMapping.length > 0){
                            if(userMapping[0].isMobileActive === true){
                                request({
                                    url: baseURL + '/api/mobusers/updation',
                                    method: 'post',
                                    json: {
                                        username:user.username,
                                        password:CryptoJS.MD5(data.password).toString(),
                                        old_username:user.username,
                                        isEncryptionEnabled :true
                                    }
                                }, function(error, response, body){
                                    console.log('res ',response);
                                    if(error) {
                                        console.log(error);
                                        //rollback
                                        // db.User.update({password: user.password},{
                                        //     where: {
                                        //         id: user.id,
                                        //         username: user.username,
                                        //     }
                                        // });

                                        res.json({
                                            success: false,
                                            message: 'Error occured on server while sending message.\nError: ' + error.message
                                        });
                                    } 
                                    else{
                                        if(response.statusCode === 500){
                                            //rollback
                                            db.User.update({password: user.password},{
                                                where: {
                                                    id: user.id,
                                                    username: user.username,
                                                }
                                            });
                                            res.json({
                                                success: false,
                                                message: "Error occured while reseting password"
                                            }); 
                                        }
                                        else{
                                            return res.json({
                                                success: true,
                                                message: message.auth.success.NEWPASSWORD_SUCCESS
                                            });
                                        }
                                    }
                                });
                            }
                            else{
                                return res.json({
                                    success: true,
                                    message: message.auth.success.NEWPASSWORD_SUCCESS
                                });
                            }
                        }
                        else{
                            return res.json({
                                success: true,
                                message: message.auth.success.NEWPASSWORD_SUCCESS
                            });
                        }
                    });
                    return res.json({
                        success: true,
                        message: message.auth.success.NEWPASSWORD_SUCCESS
                    });
                })
                .catch(function(err){
                     console.log(err);
                     return res.json({
                         success: false,
                         message: 'Error occured while reseting password',
                         error: err
                     });
                });
        }
    });
});


authRouter.post('/resetpasswordlinkexpired', function(req, res){
    var data = req.body;
    var base64decode = new Buffer(data.id,'base64');
    var userId=base64decode.toString('UTF-8')
  
    var User = db.User.findOne({
        include: {
            model: db.Role,
            attributes: {
                exclude: ['id','createdAt','updatedAt','system']
            }
        },
        attributes: {
            exclude: ['createdAt','updatedAt','RoleId','active','password']
        },
        where: {
            id : userId,
            active: true
        }
    });
    
    User.then(function(user){
        if(user === null || user === undefined){
            return res.json({
                success: false,
                message: 'Error occured while reseting password',
            });
        }else{
            // link expired validation
            var keytime=user.changereqdate;

            if( keytime === null || (new Date().getTime()-keytime) > (parseInt(config.constant.RESET_PASSWORD_LINK_EXPIRED_HOURS) * (60*60*1000))){
                return res.json({
                        success: false,
                        message: message.auth.error.LINK_EXPIRED
                });
            }
            return res.json({
                    success: true,
                    message: 'Success'
            });
        }
    });
});
authRouter.post('/userDetail', function (req, res) {
    console.log(req.body);
    
    console.log("accessToken : " + global.sfdc.accessToken);
    console.log("instanceUrl : " + global.sfdc.instanceUrl);
    console.log("orgId : " + global.sfdc.orgId);
    
    var username = req.body.username;
    var password = req.body.password;
    
    if(!username && !password){
        return res.json({
            success: false,
            message: message.auth.error.USERNAME_PASSWORD_MISSING
        });
    }
    
    var ciphertext = CryptoJS.MD5(password);
    password = ciphertext.toString();
    
    var User = db.User.findOne({
        attributes: ['id','firstname','password','lastname','userdata','email','username'],
        include: [{
            model: db.Role,
            attributes:['id','name']
        },{
            model: db.Language,
            attributes: ['id','name','code']
        }],
        where: {
            username: username,
            active: true
        }
    });
    
    User.then(function(user){
        if((user == null || !user) || user.password != password){
            return res.json({
                success: false,
                message: message.auth.error.INVALID_CREDENTIALS
            });
        } else {
            
            var userData=JSON.parse(user.userdata);
                return res.json({
                    userDetails: {
                        usertype:'HEROKU_USER',
                        connection:{
                            OrgId:global.sfdc.orgId,
                            ApexServerUrl:global.sfdc.instanceUrl+'/services/Soap/s/'+global.sfdc.version,
                            SessionId:global.sfdc.accessToken
                        },
                        user :{
                            id:user.id,
                            saleforceId:userData.Id,
                            firstName:user.firstname,
                            lastName:user.lastname,
                            middleInitial:userData.akritivesm__Middle_Initial__c,
                            enableDelegation:userData.akritivesm__Enable_Delegation__c,
                            delegateUserId:userData.akritivesm__Delegate_User__c,
                            supervisorId:userData.akritivesm__Supervisor__c,
                            status:userData.akritivesm__Status__c,
                            email:user.email,
                            username:user.username,
                            role :{
                                id:user.Role.id,
                                rolname:user.Role.name
                            },
                            lang_mstr :{
                                id:user.Language.id,
                                language_name:user.Language.name,
                                language_code:user.Language.code
                            },
                            fullname:user.firstname+" "+(user.akritivesm__Middle_Initial__c ==null?'':user.akritivesm__Middle_Initial__c)+" "+user.lastname
                        }
                    }
                });
        }
    });
});

module.exports = authRouter;