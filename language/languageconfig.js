languageconfig = {};
languageconfig.refreshLanguageConfig = function (){
    var findAllLanguages = global.db.Language.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: null 
    });

    findAllLanguages.then(function(languages){
        languageconfig.languageTransaltionMap = {};
        languageconfig.loginPageTransaltionMap = {};
        languages.forEach(function(language){
            languageconfig[language.name] = language;
            // if(language.created){
                db.Translation.findAll({
                    attributes: {
                        exclude: ['id','createdAt','updatedAt','type','LanguageId','SObjectId','SObjectLayoutSectionId']
                    },
                    where:{
                        LanguageId: language.id
                    }
                }).then(function(translations){
                    languageconfig.languageTransaltionMap[language.code] = translations;
                    // console.log(languageconfig.languageTransaltionMap);
                });
                db.Translation.findAll({
                    attributes: {
                        exclude: ['id','createdAt','updatedAt','type','LanguageId','SObjectId','SObjectLayoutSectionId']
                    },
                    where:{
                        LanguageId: language.id,
                        type:'Fixed-Label'
                    }
                }).then(function(translations){
                    languageconfig.loginPageTransaltionMap[language.code] = translations;
                    // console.log(languageconfig.languageTransaltionMap);
                });
            // }
        });
    });
}
languageconfig.refreshEnableLanguage = function (){
    var findAllLanguages = global.db.Language.findAll({
        attributes: ['name','code','label'],
        where: {active:true} 
    });

    findAllLanguages.then(function(languages){
        languageconfig.enableLanguages = languages;
        
    });
}
languageconfig.refreshLanguageConfig();
languageconfig.refreshEnableLanguage();
module.exports = languageconfig;