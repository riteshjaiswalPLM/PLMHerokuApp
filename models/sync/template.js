module.exports = {
    sync: function(models, callback){
        var Template = models.Template;
        
        Template.sync().then(function(){
            Template.count().then(function(templateCount){
                if (templateCount ===  0) {
                    models.Language.findOne({
                        attributes: ['id'],
                        where: { code:  'en' }
                    }).then(function (englishLanguage) {
                        engLangId = englishLanguage.id;
                    Template.bulkCreate([
                        { 
                            utilityname: 'reset-password',
                            subject:'Finish resetting your ESM Buyer Portal password',
                            body:"ESM Buyer Portal recently received a request to reset the password for the username $username$ .To finish resetting your password, go to the following link. This link expires in 24  hours.<br><br>$link$<br>If you didn't ask for your password to be reset, contact your ESM Buyer Portal administrator.",
                            emailtype:'html',
                            active: true,
                            LanguageId:engLangId
                        },
                       
                    ]).then(function(){
                        console.log("Mail template created successfully!");
                        callback && callback();
                    });
                    });
                }else{
                    callback && callback();
                }
            });
        });
    }
};