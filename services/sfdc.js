var request = require('request');
if(!global.hasOwnProperty('sfdc')){
    var jsForce = require('jsforce');
    var conn = null;

    var describeSObjects = function(callback){
        conn.describeGlobal(function (err, res) {
            if(!err){
                var sObjects = [];
                console.log("res.sobjects.length" + res.sobjects.length);
                res.sobjects.forEach(function(sObject, index, array){
                    // if(!sObject.customSetting && sObject.triggerable)
                    {
                        sObjects.push(sObject);
                    }
                });
                console.log("sobjects.length" + sObjects.length);
                res.sobjects = sObjects;
                console.log("res.sobjects.length" + res.sobjects.length);
            }
            return callback(err,res);
        });
    };
    var describeSObject = function(sObjectName,callback){
        conn.describe(sObjectName,function(err, meta){
            return callback(err, meta);
        });
    }
    var sobject = function(sObjectName){
        return conn.sobject(sObjectName);
    }

    var getConnection = function(callback){
        if(conn === null || conn === undefined){
            return createConnection(callback);
        }else{
            return callback(null, conn);
        }
    };
    var setConnection = function(newJsForceConnection,userInfo,callback){
        conn = newJsForceConnection;
        global.sfdc.accessToken = conn.accessToken;
        global.sfdc.instanceUrl = conn.instanceUrl;
        global.sfdc.orgId = userInfo.organizationId;
        global.sfdc.version =conn.version;

       conn.on('refresh', function(accessToken, result) {
            console.log('on refresh :: ', accessToken);
            global.sfdc.accessToken = accessToken;
        });
         
        console.info(">>> NEW CONNECTION ESTABLISHED ---------------------------- >>>");
        console.info(">>> accessToken   : " + global.sfdc.accessToken);
        console.info(">>> instanceUrl   : " + global.sfdc.instanceUrl);
        console.info(">>> orgId         : " + global.sfdc.orgId);
        console.info(">>> ApiVersion    : " + conn.version);
        console.info(">>> --------------------------------------------------- >>>");
        callback && callback();
    };
    var createConnection = function(callback){
        global.db.Salesforce.findAll().then(function(sfdcs){
            var sfdc = sfdcs[0];
            if(sfdc === null || sfdc === undefined){
                callback && callback({
                    message: 'Error occured while loading salesforce configurations!!!'
                }, null);
            }else if(sfdc.environment !== null || sfdc.environment !== ''){
            	global.sfdc.jsForceConnection = new jsForce.Connection({
                    loginUrl: (sfdc.environment === 'SANDBOX') ? 'https://test.salesforce.com' : 'https://login.salesforce.com'
                });
                console.log({
                    username: sfdc.username,
                    password: sfdc.password,
                    token: sfdc.token,
                    sfdcPassword: sfdc.password+sfdc.token
                });
                
                global.sfdc.username = sfdc.username;
                global.sfdc.password = sfdc.password;
                global.sfdc.token = sfdc.token;
                
                console.info(">>> CREATING NEW CONNECTION ------------------------------- >>>");
                console.info(">>> username      : " + sfdc.username);
                console.info(">>> password      : " + sfdc.password+sfdc.token);
                
                global.sfdc.jsForceConnection.login(sfdc.username,sfdc.password + sfdc.token, function (err, userInfo) {
                    if(err){
                        console.error(err);
                        callback && callback({
                            message: 'Error occured while creating new connection with salesforce!!!'
                        });
                    }else{
                        setConnection(global.sfdc.jsForceConnection,userInfo, function () {
                            callback && callback(null, global.sfdc.jsForceConnection);
                        });
                    }
                });
            }else{
                callback && callback({
                    message: 'Invalid salesforce credentials!!!. Please verify.'
                }, null);
            }
        });
    }

    var saveAndSubscribeUserSyncTopic = function(userMapping){
        getConnection(function(err, conn){
            if(err){
                return console.error(err.message);
            }
            var pushTopicQuery = '';
            getUserMapping(userMapping,function(err, UserMapping){
                if(err){
                    return console.error('ERROR :: ' + err.message);
                }else if(UserMapping.SObject === null || UserMapping.SObject === undefined){
                    return console.error('No SObject configured for user object.');
                }

                var queryFields = [];
                UserMapping.SObject.SObjectFields.forEach(function(field){
                    queryFields.push(field.name);
                });
                pushTopicQuery = 'SELECT ' + queryFields.toString() + ' FROM ' + UserMapping.SObject.name;
                console.log(pushTopicQuery);
                conn.sobject('PushTopic')
                    .select('*')
                    .where({
                        Name: 'HerokuUserSyncTopic'
                    })
                    .execute(function(err, records){
                        if(err){
                            return console.error(err, ret);
                        }
                        if(records.length > 0){
                            //==== UPDATE ====//
                            conn.sobject('PushTopic').update({
                                Id: records[0].Id,
                                Name: 'HerokuUserSyncTopic',
                                Description: 'Sync user object with heroku application users.',
                                Query: pushTopicQuery,
                                ApiVersion: conn.version,
                                NotifyForOperationCreate: true,
                                NotifyForOperationUpdate: true,
                                NotifyForOperationUndelete: true,
                                NotifyForOperationDelete: true,
                                NotifyForFields: 'Referenced',
                                IsActive: true
                            }, function(err, ret){
                                if(err || !ret.success){
                                    return console.error(err, ret);
                                }

                                subscribeUserSyncTopic(UserMapping,ret);
                            });
                            //==== UPDATE ====//
                        }else{
                            //==== CREATE ====//
                            conn.sobject('PushTopic').create({
                                Name: 'HerokuUserSyncTopic',
                                Description: 'Sync user object with heroku application users.',
                                Query: pushTopicQuery,
                                ApiVersion: conn.version,
                                NotifyForOperationCreate: true,
                                NotifyForOperationUpdate: true,
                                NotifyForOperationUndelete: true,
                                NotifyForOperationDelete: true,
                                NotifyForFields: 'Referenced',
                                IsActive: true
                            }, function(err, ret){
                                if(err && !ret.success){
                                    return console.error(err, ret);
                                }

                                subscribeUserSyncTopic(UserMapping,ret);
                            });
                            //==== CREATE ====//
                        }
                    });
            });

        });
    }

    var subscribeUserSyncTopic = function(UserMapping,userSyncTopic){
        global.UserMapping = UserMapping;
        getConnection(function(err, conn){
            if(err){
                return console.error(err.message);
            }
            if(global.sfdc.userSyncSubscriptionCount === 0){
                console.log('Subscribing to HerokuUserSyncTopic...');
                conn.streaming.topic('HerokuUserSyncTopic').subscribe(function(message){
                    console.log('Event Type : ' + message.event.type);
                    console.log('Event Created : ' + message.event.createdDate);
                    console.log('Object Id : ' + message.sobject.Id);
                    if(global.UserMapping === null || global.UserMapping === undefined){
                        getUserMapping(null, function(err, newUserMapping){
                            if(err){
                                console.error('HerokuUserSyncTopic->getUserMapping:ERROR :: ' + err.message);
                            }else{
                                getDefaultRole(function(err, defaultRole){
                                    if(err){
                                        console.error('HerokuUserSyncTopic->getDefaultRole:ERROR :: ' + err.message);
                                    }else{
                                        global.UserMapping = newUserMapping;
                                        global.UserMapping.defaultRole = defaultRole;
                                        console.log("USER_MAPPINGS-> DEFAULT ROLE :: " + global.UserMapping.defaultRole);
                                        updateUser(global.UserMapping, message);
                                    }
                                });
                            }
                        });
                    }else{
                        updateUser(global.UserMapping, message);
                    }
                    // console.log(message);
                }).then(function(){
                    global.sfdc.userSyncSubscriptionCount++;
                    console.log('HerokuUserSyncTopic subscribed successfully with count : ' + global.sfdc.userSyncSubscriptionCount);
                });
            }
        });
    }

    var getDefaultRole = function(callback){
        db.Role.findOne({
            where: {
                default: true
            }
        }).then(function(defaultRole){
            if(defaultRole === null || defaultRole === undefined){
                callback({
                    message: 'Default role is not defined!'
                },null);
            }else{
                callback(null, defaultRole);
            }
        });
    }

    var getUserMapping = function(userMapping, callback){
        var options = {
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
        };
        if(userMapping){
            options.where = {
                id: userMapping.id
            }
            db.UserMapping.findOne(options).then(function(UserMapping){
                if(UserMapping === null || UserMapping === undefined){
                    callback({
                        message: 'No configuration found for UserMapping.'
                    },null);
                }else{
                    callback(null,UserMapping);
                }
            });
        }else{
            db.UserMapping.findAll(options).then(function(UserMappings){
                if(UserMappings === null || UserMappings === undefined || UserMappings.length === 0){
                    callback({
                        message: 'No configuration found for UserMapping.'
                    },null);
                }else{
                    callback(null,UserMappings[0]);
                }
            });
        }
    }

    var updateUser = function(userMapping, message){

        var isUserToSync = (userMapping.syncCriteria.operator === '===') ? 
                message.sobject[userMapping.syncCriteria.when.name] ===  userMapping.syncCriteria.value
                : message.sobject[userMapping.syncCriteria.when.name] !==  userMapping.syncCriteria.value;
        if(isUserToSync){
            // console.log(userMapping);
            console.log(message);
            var isUserActive = (userMapping.activeCriteria.operator === '===') ? 
                                message.sobject[userMapping.activeCriteria.when.name] ===  userMapping.activeCriteria.value
                                : message.sobject[userMapping.activeCriteria.when.name] !==  userMapping.activeCriteria.value;
            var userToSave = {
                //id: message.sobject.Id,
                firstname: message.sobject[userMapping.FirstnameField.name],
                lastname: message.sobject[userMapping.LastnameField.name],
                email: message.sobject[userMapping.EmailField.name],
                username: message.sobject[userMapping.UsernameField.name],
                active: isUserActive,
                userdata: message.sobject
            }
            if(message.event.type === 'updated' || message.event.type === 'created'){
                // UPSERT
                console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> UserToSave >>>");
                console.log(userToSave);
                console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> /UserToSave >>>");
                // global.db.User.upsert(userToSave).then(function(created){
                //     if(created){
                //         global.db.User.update({
                //             RoleId: userMapping.defaultRole.id
                //         },{
                //             where: {
                //                 id: message.sobject.Id
                //             }
                //         }).then(function(){
                //             // if(!updated) {
                //                 console.log('User created successfully');
                //             // }
                //         });
                //     }else{
                //         console.log('User updated successfully');
                //     }
                // });
                global.db.User.findOne({
                    where: {
                        id: message.sobject.Id
                    }
                }).then(function(savedUser){
                    if(savedUser === null){
                        // CREATE
                        userToSave.id = message.sobject.Id;
                        userToSave.password = userMapping.defaultPWD;
                        userToSave.RoleId = userMapping.defaultRole.id;
                        userToSave.LanguageId = languageconfig.English.id
                        global.db.User.create(userToSave).then(function(createdUser){
                            
                            if(userMapping.isMobileActive !== undefined && userMapping.isMobileActive == true)
                            {
                                console.log('in sync',createdUser.username);
                                var instanceurl=process.env.INSTANCE_URL || "https://localhost:3000"
                                syncWithMiddleware('/api/mobusers','post',{username:createdUser.username,password:createdUser.password,instanceurl:instanceurl,isEncryptionEnabled :true},function(result){
                                    if(result){
                                        console.log('>>>>>>>>>>>>>>>>> User created successfully');
                                    }
                                    else{
                                        global.db.User.destroy({where: {id :userToSave.id}});
                                        global.sfdc.sobject(global.UserMapping.SObject.name).destroy(userToSave.id);
                                        console.log('>>>>>>>>>>>>>>>>> Error occured while creating user on middleware :',result.message);
                                    }
                                })
                            }
                            else{
                                 console.log('>>>>>>>>>>>>>>>>> User created successfully');
                            }
                        });
                    }else{
                        var oldUserData = {
                            //id: message.sobject.Id,
                            firstname: savedUser.firstname,
                            lastname: savedUser.lastname,
                            email: savedUser.email,
                            username: savedUser.username,
                            active: savedUser.active,
                            userdata: JSON.parse(savedUser.userdata)
                        }
                        var oldsaveUser=JSON.parse(savedUser.userdata);
                        var isValidReq=false;

                        // restrict to execute when data rollback and push call 
                        var skipfieldname=",attributes,LastModifiedDate,LastReferencedDate,CreatedById,IsDeleted,LastViewedDate,SystemModstamp,LastActivityDate,CreatedDate,LastModifiedById,";
                        Object.keys(message.sobject).forEach(function(newKeyVal) {
                            if(skipfieldname.indexOf(","+newKeyVal+",") == -1){
                                var keyfound=false;
                                Object.keys(oldsaveUser).forEach(function(oldKeyVal)  {
                                    if(newKeyVal==oldKeyVal){
                                        keyfound=true;
                                        if (message.sobject[newKeyVal] != oldsaveUser[oldKeyVal] ) {
                                            console.log("s3 ",message.sobject[newKeyVal]  )
                                            console.log("s4 ",oldsaveUser[oldKeyVal] )
                                            isValidReq=true;
                                        }
                                    }
                                });
                                if(keyfound==false){
                                    console.log('Newfield',newKeyVal)
                                    isValidReq=true;
                                }

                            }
                            
                        });
                        
                        console.log("isValidReq",isValidReq)
                        if(isValidReq)
                        {
                            var old_username=savedUser.username;
                            global.db.User.update(userToSave,{
                                where: {
                                    id: message.sobject.Id
                                }
                            }).then(function(){
                                if(userMapping.isMobileActive !== undefined && userMapping.isMobileActive == true)
                                {
                                    console.log('in sync',userToSave.username);
                                    console.log('in sync',savedUser.password);
                                    console.log('in sync',old_username);
                                    syncWithMiddleware('/api/mobusers/updation','post',{username:userToSave.username,password:savedUser.password,old_username:old_username,isEncryptionEnabled :true},function(result){
                                        if(result){
                                            console.log('>>>>>>>>>>>>>>>>> User updated successfully');
                                        }
                                        else{
                                            //rollback data 
                                            console.log('oldUserData',oldUserData);
                                            global.db.User.update(oldUserData,{
                                                where: {
                                                    id: message.sobject.Id
                                                }
                                            }).then(function(){
                                                
                                            }).catch(function(err){console.log('err',err)});
                                            
                                            var oldData=oldUserData.userdata;

                                            // remove static column
                                            delete oldData.LastModifiedDate;
                                            delete oldData.LastReferencedDate;
                                            delete oldData.CreatedById;
                                            delete oldData.IsDeleted;
                                            delete oldData.LastViewedDate;
                                            delete oldData.SystemModstamp;
                                            delete oldData.LastActivityDate;
                                            delete oldData.CreatedDate;
                                            delete oldData.LastModifiedById;
                                            global.sfdc.sobject(global.UserMapping.SObject.name).update(oldData, function(err, ret) {
                                                if(err){
                                                    console.log('err',err)
                                                }
                                                console.log('ret',ret)
                                            }).catch(function(error) {
                                                console.log('Error ',error);
                                            });
                                            console.log('>>>>>>>>>>>>>>>>> Error occured while updating user on middleware :',result.message);
                                        }
                                    })
                                }
                                else{
                                    console.log('>>>>>>>>>>>>>>>>> User updated successfully');
                                }
                            });
                        }
                    }
                })
            }
        }
    }
    
    global.sfdc = {
        userSyncSubscriptionCount: 0,
        getUserMapping: getUserMapping,
        getDefaultRole: getDefaultRole,
        getConnection: getConnection,
        setConnection: setConnection,
        describeSObjects: describeSObjects,
        describeSObject: describeSObject,
        sobject: sobject,
        saveAndSubscribeUserSyncTopic: saveAndSubscribeUserSyncTopic,
        subscribeUserSyncTopic: subscribeUserSyncTopic
    };

    var syncWithMiddleware = function(urlPath,method,json,callback){
        var baseURL = process.env.MOBILE_AUTH_INSTANCE_URL || 'https://esm-mob-auth-v3.herokuapp.com';
        request({
            url: baseURL + urlPath,
            method: method,
            json: json
        }, function(error, response, body){
           
            if(error) {
                console.log(error);
                callback({
                    success: false,
                    message: 'Error occured on server while sending message.\nError: ' + error.message
                });
            } 
            else{
                if(response.statusCode === 503){
                    callback({
                        success: false,
                        message: 'Service unavailable'
                    }); 
                }
                else if(response.statusCode === 500 || body.success === false){
                    callback({
                        success: false,
                        message: response.body.errormessage
                    }); 
                }
                else{
                    callback({
                        success: true,
                        message: 'User create or Update successfully on middleware.',
                    });
                }
            }
        });
    }
}

module.exports = global.sfdc;