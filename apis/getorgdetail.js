var express = require('express');
var jwt = require('jsonwebtoken');
var CryptoJS = require('crypto-js');
var timestamp = require('unix-timestamp');
var path = require('path');
var os = require('os');
var fs = require('fs');
var http = require('http');
var request = require('request');
var mime = require('mime');
var authRouter = express.Router();

authRouter.post('/getOrgDetail', function (req, res) {
    console.log(req.body);
    var credential=req.body.credentials;
    
    console.log("accessToken : " + global.sfdc.accessToken);
    console.log("instanceUrl : " + global.sfdc.instanceUrl);
    console.log("orgId : " + global.sfdc.orgId);
    
    var username = credential.username;
    var password = credential.password;
    
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
            username: {$iLike: username},
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
        	// global.sfdc.jsForceConnection.login(global.sfdc.username,global.sfdc.password + global.sfdc.token, function (err, userInfo) {
            //     if(err){
            //         console.error(err);
            //         res.status = 500;
            //         return res.json({
            //         	message : err
            //         });
            //     }else{
                    console.log('authenticated accessToken :: ', global.sfdc.accessToken);
                    var userData=JSON.parse(user.userdata);
                    return res.json({
                    	data: {
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
            //     }
            // });
        }
    });
});

authRouter.get('/getAttachmentFile', function (req, res) {
    if(req.query.id!=undefined && req.query.id!=null ){
    global.sfdc
        .sobject("Attachment")
        .select("Name,Body,ContentType,BodyLength")
        .where({id:req.query.id})
        .limit(100)
        .execute(function(err, records){

            if(err ){
                 return res.json({
                    success: false,
                    message: 'Error occured while open Attachment.\n' + err.name + ' : ' + err.message,
                    error: err
                });
            }
             if(records.length==0 ){
                 return res.json({
                    success: false,
                    message: ' Attachment Not Exist.',
                    error: err
                });
            }
            
            var config = {
                method: 'GET',
                uri: global.sfdc.instanceUrl+records[0].Body,
                headers: {
                    "Authorization": "Bearer "+global.sfdc.accessToken,
                    
                }
            };
            var stream = request(config).pipe(fs.createWriteStream(os.tmpdir()+'/'+records[0].Name, {autoClose: true}));
            stream.on('finish',function(){
                fs.createReadStream(os.tmpdir()+'/'+records[0].Name, { bufferSize: 64 * 1024 }).pipe(res);
            });
        });
    }
    else{
        return res.json({
            success: false,
            message: 'Invalid Request.',
            error: 'Mandatory Parameter Missing '
        });
    }
});

authRouter.post('/refreshtoken', function (req, res) {
    global.sfdc.jsForceConnection.login(global.sfdc.username,global.sfdc.password + global.sfdc.token, function (err, userInfo) {
        if(err){
            console.error(err);
            res.status = 500;
            return res.json({
                message : err
            });
        }else{
            global.sfdc.accessToken=global.sfdc.jsForceConnection.accessToken;
            res.json({
                status:"success",
                sessionid:global.sfdc.accessToken
            });
        }
    });
       
});

module.exports = authRouter;