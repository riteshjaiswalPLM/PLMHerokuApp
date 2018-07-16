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
            utilityname: utilityname,
            active:true,
            LanguageId: dataObject.LanguageId,
        }
    }).then(function(template){
        if(template == null || template == 0){
            db.Language.findOne({
                attributes: ['id'],
                where: { code:  'en' }
            }).then(function (englishLanguage) {
                if(englishLanguage==null){
                        callback({
                        success: false,
                        message: 'template utilityname not exist.'
                    });
                }
                engLangId = englishLanguage.id;
                db.Template.findOne({
                    attributes: {
                        exclude: ['createdAt','updatedAt']
                    },
                    where: {
                        utilityname: utilityname,
                        LanguageId: engLangId,
                    }
                }).then(function(defaulttemplate){
                    if(defaulttemplate==null){
                        callback({
                            success: false,
                            message: 'template utilityname not exist.'
                        });
                    }
                    setEmailDetail(defaulttemplate,dataObject,callback);
                });
            });
           
        }
        else{
            setEmailDetail(template,dataObject,callback);
        }
    });
}

var setEmailDetail = function(template,dataObject,callback){
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

module.exports = mailconfig;