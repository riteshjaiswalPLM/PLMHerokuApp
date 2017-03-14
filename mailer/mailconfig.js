var nodemailer = require('nodemailer');
var path = require('path');
var fs = require('fs');

mailconfig ={};

mailconfig.mailsender = nodemailer.createTransport(global.config.smtpconfig);

mailconfig.mailsender.emailId=global.config.smtpconfig.auth.user;

mailconfig.mailsender.getTemplate = function(utilityname,dataObject,callback){

    db.Template.findOne({
         attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: {
            utilityname: utilityname
        }
    }).then(function(template){
        if(template == null){
            callback({
                success: false,
                message: 'template utilityname not exist.'
            });
        }
        else{

            var key,emailBody=template.body,emailSubject=template.subject;
            for(key in dataObject){
                var regExp=new RegExp('\\$'+key+'\\$','g')
                emailBody=emailBody.replace(regExp,dataObject[key]);
                emailSubject=emailSubject.replace(regExp,dataObject[key]);
            }
            
            callback({
                success: true,
                message: 'Success',
                data:{
                    subject:emailSubject,
                    body:emailBody,
                    emailtype:template.emailtype
                }
            });
        }
    });
}

    

module.exports = mailconfig;