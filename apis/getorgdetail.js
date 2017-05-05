var express = require('express');
var jwt = require('jsonwebtoken');
var CryptoJS = require('crypto-js');
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
        	global.sfdc.jsForceConnection.login(global.sfdc.username,global.sfdc.password + global.sfdc.token, function (err, userInfo) {
                if(err){
                    console.error(err);
                    res.status = 500;
                    return res.json({
                    	message : err
                    });
                }else{
                    console.log('authenticated accessToken :: ', global.sfdc.jsForceConnection.accessToken);
                    var userData=JSON.parse(user.userdata);
                    return res.json({
                    	data: {
                    		usertype:'HEROKU_USER',
                    		connection:{
                    			OrgId:global.sfdc.orgId,
                    			ApexServerUrl:global.sfdc.instanceUrl+'/services/Soap/s/'+global.sfdc.version,
                    			SessionId:global.sfdc.jsForceConnection.accessToken
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
        }
    });
});

module.exports = authRouter;