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
var fixedTranslationArray = ["Back to List","Save","Cancel","Edit","Related lists","Search Criteria","Search","Search Results","No result found","Page size","Previous","Next","Loading","Select","None","Close","Refresh Results","OK","Profile","Settings","Logout","Dashboard"], engLangId;

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