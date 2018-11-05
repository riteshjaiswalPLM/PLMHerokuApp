module.exports = {
    sync: function(models, callback){
        var Translation = models.Translation;
        
        Translation.sync().then(function(){
            models.Language.findOne({
                attributes: ['id'],
                where: {code: 'en'} 
            }).then(function(englishLanguage){
                engLangId = englishLanguage.id;
                Translation.findAll({
                    attributes: {
                        exclude: ['createdAt','updatedAt']
                    },
                    where:{
                        LanguageId: engLangId,
                        type: 'Fixed-Label'
                    }
                }).then(function(fixedTranslationsInDBForEng){
                    var fixedTranslationToCreate = getFixedTranslationToCreate(), _fixedTranslationArray = fixedTranslationArray;
                    if(fixedTranslationsInDBForEng !== undefined || fixedTranslationsInDBForEng !== null && fixedTranslationsInDBForEng.length > 0){
                        fixedTranslationsInDBForEng.forEach(function(fixedTranslationInDBForEng){
                            var index = _fixedTranslationArray.indexOf(fixedTranslationInDBForEng.label); 
                            if(index > -1){
                                fixedTranslationToCreate.splice(index, 1);
                                _fixedTranslationArray.splice(index, 1);
                            }
                        });
                    }
                    if(fixedTranslationToCreate.length > 0){
                        Translation.bulkCreate(fixedTranslationToCreate).then(function(){
                            console.log("Static captions created successfully!");
                            callback && callback();
                        });
                    }
                    else{
                        callback && callback();
                    }
                });
            });
        });
    }
};
var fixedTranslationArray = ["Back to List","Save","Cancel","Edit","Related lists","Search Criteria","Search","Search Results","No result found","Page size","Previous","Next","Loading","Select","None","Close","Refresh Results","OK","Profile","Settings","Logout","Dashboard","Bulk Operation","Items per page","Reset","Export","My Task","Home","Upload Primary Document","Add","format are supported","Upload","No attachment found","Attach File","Delete","Title","Size","ContentType","Download","Attachment Section","File","Size in Bytes","Recall","Add more","Request Field","Current Value","Proposed Value","Reload","New","Manage Profile","Change Password","Other Settings","User Information","Profile","Select Default Language","Select Default Time Zone","Select Default Locale","Password Information","Current Password","New Password","Confirm new password","Valid password format","Password must contain atleast one","letter","number","special character","Password length must be between","5 - 19","Select the File to be attached","Actions","User Name","Password","Forgot Password","Login","Logged In","Welcome","No records found.","Enter your current password","Enter new password","Type new password again","Settings saved successfully.","Password field must not be blank","Password format is invalid","Password does not match","Current Password and New Password must not be same","Password updated successfully.","Action","Submit","Submiting...","Logging In ...","Reset new password","No Record found.","Failed to authenticate token!","Access denied!","No token provided!","Username and password missing!","Invalid credentials!","404 not found!","Username does not exist!","Password reset link is Expired or Used!","Authentication success!","Password Reset Link Sent to Your Email Id","New Password Applied Sucessfully","Success!","Error!","Reports","Archival","Bulk Upload"], engLangId;

var getFixedTranslationToCreate = function(){
    var fixedTranslationToCreate = [];
    fixedTranslationArray.forEach(function(translation){
        fixedTranslationToCreate.push({
            label: translation, 
            translation: translation,
            type: 'Fixed-Label', 
            LanguageId: engLangId
        });
    });
    return fixedTranslationToCreate;
};