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
            // }
        });
    });
}
languageconfig.refreshLanguageConfig();
module.exports = languageconfig;