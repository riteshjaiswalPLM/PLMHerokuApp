var express = require('express');
var jwt = require('jsonwebtoken');
var CryptoJS = require('crypto-js');
var authRouter = express.Router();

authRouter.post('/authenticate', function(req, res){
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
        include: [{
            model: db.Role,
            attributes: {
                exclude: ['id','createdAt','updatedAt','system']
            }
        },{
            model: db.Language,
            attributes: ['id','name','code']
        }],
        attributes: {
            exclude: ['createdAt','updatedAt','RoleId','active','LanguageId']
        },
        where: {
            username: username,
            active: true
        }
    });
    
    User.then(function(user){
        console.log(JSON.stringify(user));
        console.log(password);
        
        if((user == null || !user) || user.password != password){
            return res.json({
                success: false,
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
                return res.json({
                    success: true,
                    message: message.auth.success.AUTHENTICATION_SUCCESS,
                    token: token,
                    user: clonedUser,
                    translation: translation
                });
            }
            else{
                return res.json({
                    success: true,
                    message: message.auth.success.AUTHENTICATION_SUCCESS,
                    token: token,
                    user: clonedUser
                });
            }
            
            /*
            if(Role !== 'ADMINISTRATOR'){
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
                                active: true
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
                    // clonedUser.tabs = tabs;
                    clonedUser.states = [];
                    tabs.forEach(function(tab){
                        if(tab.SObject.SObjectLayouts !== null && tab.SObject.SObjectLayouts !== undefined){
                            tab.SObject.SObjectLayouts.forEach(function(layout){
                                var stateName = 'client.' + tab.SObject.keyPrefix + '.' + layout.type.toLowerCase();
                                var controllerName = 'Client' + layout.type + 'LayoutController';
                                if(layout.default){
                                    clonedUser.states.push({
                                        name: 'client.' + tab.SObject.keyPrefix,
                                        controller: 'ClientLayoutController',
                                        templateUrl: 'views/client/layout/index.html',
                                        params:{
                                            data: {
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
                                clonedUser.states.push({
                                    name: stateName,
                                    controller: controllerName,
                                    templateUrl: 'views/client/layout/'+layout.type.toLowerCase()+'.html',
                                    params:{
                                        data: {
                                            sobject: {
                                                id: tab.SObject.id,
                                                name: tab.SObject.name
                                            },  
                                            layout: {
                                                id: layout.id,
                                                type: layout.type
                                            }
                                        }
                                    },
                                    title: (layout.type === 'List') ? tab.SObject.labelPlural : layout.type + ' ' + tab.SObject.label
                                });
                            });
                        }
                        
                        // if(tab.SObjectLayout !== null && tab.SObjectLayout !== undefined){
                        //     var stateName = 'client.' + tab.SObject.keyPrefix; 
                        //     var defaultStateName = 'client.' + tab.SObject.keyPrefix + '.' + tab.SObjectLayout.type.toLowerCase();
                        //     var state = {
                        //         controller: 'ClientLayoutController',
                        //         name: stateName,
                        //         title: tab.label,
                        //         params:{
                        //             data: {
                        //                 redirectTo: defaultStateName
                        //             }
                        //         },
                        //         tab:{
                        //             label: tab.label,
                        //             icon: (tab.Icon) ? tab.Icon.class : null,
                        //             keyPrefix: tab.SObject.keyPrefix,
                        //             id: tab.id
                        //         }
                        //     };
                        //     clonedUser.states.push(state);
                        // }
                    });
                    return res.json({
                        success: true,
                        message: message.auth.success.AUTHENTICATION_SUCCESS,
                        token: token,
                        user: clonedUser
                    });
                });
            }else{
                return res.json({
                    success: true,
                    message: message.auth.success.AUTHENTICATION_SUCCESS,
                    token: token,
                    user: clonedUser
                });
            }
            */
        }
    });
});

authRouter.post('/states', function(req, res){
    var user = req.body;
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
                                        templateUrl: 'views/client/layout/index.html',
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
                                    templateUrl: 'views/client/layout/'+layout.type.toLowerCase()+'.html',
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
                                        templateUrl: 'views/client/profile/index.html',
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
                success: false,
                message: message.auth.error.INVALID_USERNAME
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

module.exports = authRouter;