var express = require('express');
var userRouter = express.Router();
var request = require('request');

userRouter.post('/getUserMapping', function (req, res) {
    sfdc.getUserMapping(null, function (err, UserMapping) {
        console.info('getUserMapping...........');
        if (err) {
            return res.json({ success: false, message: err.message });
        } else {
            global.UserMapping = UserMapping;
            return res.json({
                success: true,
                userMapping: global.UserMapping
            });
        }
    });
});

userRouter.post('/list', function (req, res) {
    var Users = db
        .User
        .findAll({
            attributes: {
                exclude: ['userdata', 'password', 'RoleId']
            },
            include: {
                model: db.Role,
                attributes: ['id', 'name']
            },
            where: {
                RoleId: {
                    $ne: 1
                }
            }
        });

    Users.then(function (users) {
        if (users === undefined || users === null) {
            return res.json({success: false, message: 'Error occured while loading users.'});
        } else {
            return res.json({
                success: true,
                data: {
                    users: users
                }
            });
        }
    });
});

userRouter.post('/sync', function (req, res) {
    // if (global.UserMapping === null || global.UserMapping === undefined) {
        sfdc
            .getUserMapping(null, function (err, UserMapping) {
                console.info('getUserMapping...........');
                if (err) {
                    return res.json({success: false, message: err.message});
                } else {
                    sfdc.getDefaultRole(function(err, defaultRole){
                        console.info('getDefaultRole...........');
                        if(err){
                            console.error('/sync->getDefaultRole:ERROR :: ' + err.message);
                        }else{
                            global.UserMapping = UserMapping;
                            global.UserMapping.defaultRole = defaultRole;
                            console.log('IF ...syncUsers...........');
                            syncUsers();
                            // returnUserMapping();
                        }
                    });
                }
            });
    // } else {
    //     console.log('ELSE ...syncUsers...........');
    //     //console.log(global.UserMapping);
    //     syncUsers();
    //     //  returnUserMapping();
    // }

    var returnUserMapping = function(){
        return res.json({
            success: true,
            data: {
                UserMapping: global.UserMapping
            }
        });
    }

    var syncUsers = function () {
        console.log('syncUsers...........');
        var selectFields = [];
        global
            .UserMapping
            .SObject
            .SObjectFields
            .forEach(function (field, index, array) {
                selectFields.push(field.name);
            });
        var whereFields = {}
        whereFields[global.UserMapping.syncCriteria.when.name] = (global.UserMapping.syncCriteria.operator === '===')
            ? global.UserMapping.syncCriteria.value
            : {
                $ne: global.UserMapping.syncCriteria.value
            };
        
        console.log(whereFields);
        global
            .sfdc
            .sobject(global.UserMapping.SObject.name)
            .select(selectFields.toString())
            .where(whereFields)
            .execute(function (err, records) {
                console.info('SQOL execute...........');
                if (err) {
                    return res.json({
                        success: false, 
                        message: 'Error occured while syncing users.', 
                        error: err
                    });
                }else{
                    var syncErrors = [];
                    async.each(records, function(record, callback){
                        var isUserActive = false;
                        isUserActive = (global.UserMapping.activeCriteria.operator === '===') ? 
                            record[global.UserMapping.activeCriteria.when.name] ===  global.UserMapping.activeCriteria.value
                            : record[global.UserMapping.activeCriteria.when.name] !==  global.UserMapping.activeCriteria.value;
                        var userToSave = {
                            firstname: record[global.UserMapping.FirstnameField.name],
                            lastname: record[global.UserMapping.LastnameField.name],
                            email: record[global.UserMapping.EmailField.name],
                            username: record[global.UserMapping.UsernameField.name],
                            faderationId: record[global.UserMapping.FederationIdField.name],
                            active: isUserActive,
                            userdata: record,
                            LanguageId: languageconfig.English.id
                        };
                        global.db.User.update(userToSave,{
                            where: {
                                id: record.Id
                            }
                        }).spread(function(affectedCount, affectedRows){
                            if(affectedCount === 0){
                                userToSave.id = record.Id;
                                userToSave.password = global.UserMapping.defaultPWD;
                                userToSave.RoleId = global.UserMapping.defaultRole.id;
                                userToSave.LanguageId = languageconfig.English.id
                                global.db.User.create(userToSave).then(function(createdUser){
                                    var instanceurl=process.env.INSTANCE_URL || "http://localhost:3000"
                                    syncWithMiddleware('/api/mobusers','post',{federationid:createdUser.faderationId,username:createdUser.username,password:createdUser.password,instanceurl:instanceurl,isEncryptionEnabled :true,organization_id:global.sfdc.orgId},function(result){
                                        if(result){
                                            console.log('>>>>>>>>>>>>>>>>> User created successfully',result);
                                        }
                                        else{
                                            console.log('>>>>>>>>>>>>>>>>> Error occured while creating user on middleware :',result.message);
                                        }
                                    })
                                    callback();
                                }).catch(function(err){
                                    syncErrors.push({
                                        recordId: record.Id,
                                        errMsg: err.errors[0].message 
                                    });
                                    callback();
                                });
                            }else{
                                syncWithMiddleware('/api/mobusers/updation','post',{federationid:userToSave.faderationId,username:userToSave.username,isEncryptionEnabled :true},function(result){
                                    if(result){
                                        console.log('>>>>>>>>>>>>>>>>> User updated successfully',result);
                                    }
                                    else{
                                        //rollback data 
                                        console.log('>>>>>>>>>>>>>>>>> Error occured while updating user on middleware :',result.message);
                                    }
                                });  
                                callback();
                            }
                        }).catch(function(err){
                            if(err.errors && err.errors.length > 0){
                                syncErrors.push({
                                    recordId: record.Id,
                                    errMsg: err.errors[0].message 
                                });
                            }else{
                                syncErrors.push({
                                    recordId: record.Id,
                                    error: err 
                                });
                            }
                            callback();
                        });;
                    }, function(err){
                        if(err){
                            return res.json({
                                success: false,
                                error: err
                            });
                        }else{
                            return res.json({
                                success: true,
                                data: {
                                    errors: syncErrors
                                }
                            });
                        }
                    });
                }
            });
    }

    
});
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

userRouter.post('/getUserLayoutDetail', function(req, res){
    var ltype="Create";
    if(req.body !=undefined && req.body.type !=undefined){
        ltype=req.body.type;
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
            where.type = ltype;
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
                if(sObjectLayout === undefined || sObjectLayout === null || sObjectLayout.length === 0){
                    return res.json({
                        success: false,
                        message: "Error occured while get user Mapping"
                    });
                }else{
                    return res.json({
                        success: true,
                        metadata: {
                            sobject: {
                                id: sObjectLayout[0].SObject.id,
                                name: sObjectLayout[0].SObject.name
                            },  
                            layout: {
                                id: sObjectLayout[0].id,
                                type: sObjectLayout[0].type
                            },
                            isMobileActive:userMapping[0].isMobileActive,
                            redirectTo :'admin.usermanagement.users.list'
                        }
                    });
                }
            });
        }
        else{
            return res.json({
                success: false,
                message: "User Mapping Not Configured,Please configured it"
            });
        }
    });
});

userRouter.post('/checkusernameexist', function (req, res) {
    var username=req.body.username;
    console.log('data',username);
    var baseURL = process.env.MOBILE_AUTH_INSTANCE_URL || 'https://esm-mob-auth-v3.herokuapp.com';
    request({
        url: baseURL + '/api/mobusers/check-uniqueness/',
        method: 'Post',
        json: {
            username: username
        }
    }, function(error, response, body){
        if(error) {
            console.log(error);
            res.json({
                success: false,
                message: 'Error occured on server while check uniqueness.\nError: ' + error.message
            });
        } 
        else{
            if(response.statusCode === 500){
                res.json({
                    success: false,
                    message: response.body.errormessage
                }); 
            }
            else{
                console.log(response.body);
                return res.json({
                    success: true,
                    message:"User Name Available"
                });
            }
        }   
    });
});
module.exports = userRouter;