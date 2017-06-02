var express = require('express');
var languageRouter = express.Router();
var csv = require('express-csv');
var request = require('request');

languageRouter.post('/list', function(req, res){
    var criteria = (req.body) ? req.body.criteria : undefined;
    var where = (criteria) ? criteria.where : undefined;
    var Languages = db.Language.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: (where) ? where : null,
        order: [
            ['id']
        ]
    });
    
    Languages.then(function(languages) {
        if(languages === undefined || languages === null){
            return res.json({
                success: false,
                message: 'Error occured while loading languages.'
            });
        }else{
            return res.json({
                success: true,
                data: {
                    languages: languages
                }
            });
        }
    });
});

languageRouter.post('/save', function(req, res){
    var languageToSave = req.body;
    if(languageToSave === null || languageToSave === undefined){
        return res.json({
            success: false,
            message: 'No data found for language.'
        });
    } else {
        db.Language.update({
            name: languageToSave.name,
            active: languageToSave.active,
            default: languageToSave.active ? languageToSave.default : false,
            created: true,
        },{
            where: {
                id: languageToSave.id
            }
        }).then(function(){
            return res.json({
                success: true
            });
        });
    }
});

languageRouter.post('/delete', function(req, res){
    var Language = req.body;
    db.Language.update({
        active: false,
        created: false,
        default: false
    },{
        where: {
            id: Language.id
        }
    }).then(function(){
        global.db.Translation.destroy({
            where: {
                LanguageId: Language.id
            }
        }).then(function(){
            return res.json({
                success: true
            });
        });
    });          
});
languageRouter.post('/languagedetail', function(req, res){
    var language = req.body;
    if(language === null || language === undefined || language.aspect === null || language.aspect === undefined){
        return res.json({
            success: false,
            message: 'No data found for language.'
        });
    } else {
        if(language.aspect !== 'Fixed Label' && (!language.SObject || !language.SObject === null || language.SObject.id === null || !language.SObject.id)){
            return res.json({
                success: false,
                message: 'No data found for language.'
            });
        }
        var where = {};
        where.type = language.aspect === 'Field Label' ? 'SObject-Label' : language.aspect === 'Fixed Label' ? 'Fixed-Label' : 'SObject-Section';
        where.LanguageId = language.id;
        if(language.aspect !== 'Fixed Label'){
            where.SObjectId = language.SObject.id;
        }
        var translation = db.Translation.findAll({
            attributes: {
                exclude: ['createdAt','updatedAt']
            },
            where: where,
            order: ['label']
        });

        translation.then(function (translations) {
            return res.json({
                success: true,
                data: {
                    translations : translations
                }
            });
        })
    }         
});
languageRouter.post('/automatelanguagetranslation', function(req, res){
    var language = req.body;
    var updatedRecordCount = 0, failedRecordCount = 0;
    var generateResponse = function() {
        if(updatedRecordCount === 0 && failedRecordCount === 0){
            return res.json({
                success: true,
                message: 'Nothing is updated. Probably all the translation have already been mapped.'
            });
        }
        if(updatedRecordCount > 0 && failedRecordCount === 0){
            return res.json({
                success: true,
                message: 'All the translation mapped successfully.'
            });
        }
        if(updatedRecordCount === 0 && failedRecordCount > 0){
            return res.json({
                success: false,
                message: 'Trasnslation mapping failed. Please try again after some time.'
            });
        }
        if(updatedRecordCount > 0 && failedRecordCount > 0){
            return res.json({
                success: true,
                message: updatedRecordCount + ' Translations mapped successfully, but '+ failedRecordCount + ' failed to translate.'
            });
        }
    };
    var autoMappingFunction = function(translations){
        var freshTranslation = [];
        var translationReqCounter = 0;
        if(translations && translations.length > 0){
            translations.forEach(function(translation, index){
                if(translation.label == translation.translation && language.id != global.languageconfig.English.id){
                    request({
                        url: 'http://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl='+language.code+'&dt=t&q='+translation.label,
                        method: 'GET',
                        headers: { 
                            'Content-Type': 'application/text'
                        }
                    }, function(error, response, body){
                        translationReqCounter++;
                        if(error) {
                            console.log(error);
                            failedRecordCount++;
                            if(translations.length-1 == index == translationReqCounter){
                                global.languageconfig.refreshLanguageConfig();
                                return generateResponse();
                            }
                        } else {
                            console.log("translationReqCounter :: " + translationReqCounter);
                            var body = body.replace(/\[/g,"").replace(/\]/g,"").replace(/\"/g,"").split(",");
                            freshTranslation.push({
                                label: translation.label, 
                                translation: body[0], 
                                type: language.aspect === 'Field Label' ? 'SObject-Label' : language.aspect === 'Fixed Label' ? 'Fixed-Label' : 'SObject-Section',
                                LanguageId: language.id,
                                SObjectId: language.aspect === 'Fixed Label' ? null : language.SObject.id,
                                SObjectLayoutSectionId: translation.SObjectLayoutSectionId
                            });
                            if(translations.length == freshTranslation.length && freshTranslation.length == translationReqCounter){
                                db.Translation.bulkCreate(freshTranslation).then(function() {
                                    updatedRecordCount = freshTranslation.length;
                                    failedRecordCount = 0;
                                    global.languageconfig.refreshLanguageConfig();
                                    return generateResponse();
                                }).catch(function(error) {
                                    updatedRecordCount = 0;
                                    failedRecordCount = freshTranslation.length;
                                    console.log(error);
                                    global.languageconfig.refreshLanguageConfig();
                                    return generateResponse();
                                });
                            }
                        }
                    });
                }
                else{
                    updatedRecordCount++
                    if(translations.length-1 == index){
                        global.languageconfig.refreshLanguageConfig();
                        return generateResponse();
                    }
                }
            });
        }
        else{
            return generateResponse();
        }
    }
    if(language === null || !language || language.aspect === null || !language.aspect){
        return res.json({
            success: false,
            message: 'No data found for language.'
        });
    }
    else{
        if(language.aspect !== 'Fixed Label' && (!language.SObject || !language.SObject === null || language.SObject.id === null || !language.SObject.id)){
            return res.json({
                success: false,
                message: 'No data found for language.'
            });
        }
        var where = {};
        if(language.aspect !== 'Fixed Label'){
            where.SObjectId = language.SObject.id;
        }
        where.type = language.aspect === 'Field Label' ? 'SObject-Label' : language.aspect === 'Fixed Label' ? 'Fixed-Label' : 'SObject-Section';
        where.LanguageId = language.id;
        db.Translation.findAll({
            attributes: {
                exclude: ['createdAt','updatedAt']
            },
            where: where,
            order: ['label']
        }).then(function(translations){
            var where ={};
            if(language.aspect !== 'Fixed Label'){
                where.SObjectId = language.SObject.id;
            }
            where.type = language.aspect === 'Field Label' ? 'SObject-Label' : language.aspect === 'Fixed Label' ? 'Fixed-Label' : 'SObject-Section';
            where.LanguageId = global.languageconfig.English.id;
            var englishTranslation = db.Translation.findAll({
                attributes: {
                    exclude: ['createdAt','updatedAt']
                },
                where: where,
                order: ['label']
            });
            englishTranslation.then(function(engTranslations) {
                if(engTranslations){
                    var _engTranslations = [];
                    var labelTrack = [];
                    var tempObj = {};
                    translations.forEach(function(translation, index){
                        tempObj[translation.label] = translation;
                    });
                    engTranslations.forEach(function(engTranslation, engIndex){
                        if(tempObj[engTranslation.label] === undefined || tempObj[engTranslation.label].translation === engTranslation.label){
                        	if(labelTrack.indexOf(engTranslation.label) === -1){
                        		_engTranslations.push(engTranslation);
                                 labelTrack.push(engTranslation.label);
                        	}
                        }
                    });
                    return autoMappingFunction(_engTranslations);
                }
                else{
                    return generateResponse();
                }
            });
        }).catch(function(){
            return res.json({
                success: false,
                message: 'Unable to complete auto trasnlation request.'
            });
        });
    }
});
languageRouter.post('/importlanguagetranslation', function(req, res){
    var language = req.body;
    var updatedRecordCount = 0, failedRecordCount = 0;
    var generateResponse = function() {
        if(updatedRecordCount === failedRecordCount === 0){
            return res.json({
                success: false,
                message: 'Nothing is updated. Probably the translation file you have chosen has already been imported.'
            });
        }
        if(updatedRecordCount > 0 && failedRecordCount === 0){
            return res.json({
                success: true,
                message: 'All the records updated successfully.'
            });
        }
        if(updatedRecordCount === 0 && failedRecordCount > 0){
            return res.json({
                success: false,
                message: 'Record updation failed. Please cross verify the file or file type.'
            });
        }
        if(updatedRecordCount > 0 && failedRecordCount > 0){
            return res.json({
                success: true,
                message: updatedRecordCount + ' Records updated successfully, but '+ failedRecordCount + ' failed to update.'
            });
        }
    };

    if(language === null || !language || language.aspect === null || !language.aspect){
        return res.json({
            success: false,
            message: 'No data found for language.'
        });
    } else {
        if(language.aspect !== 'Fixed Label' && (!language.SObject || !language.SObject === null || language.SObject.id === null || !language.SObject.id || !language.translationMappingFile || language.translationMappingFile == null)){
            return res.json({
                success: false,
                message: 'No data found for language.'
            });
        }
        if(language.translationMappingFile[0].hasOwnProperty('Label') && language.translationMappingFile[0].hasOwnProperty('Translation')){
            var where = {};
            if(language.aspect !== 'Fixed Label'){
                where.SObjectId = language.SObject.id
            }
            where.type = language.aspect === 'Field Label' ? 'SObject-Label' : language.aspect === 'Fixed Label' ? 'Fixed-Label' : 'SObject-Section';
            where.LanguageId = language.id;
            var translation = db.Translation.findAll({
                attributes: {
                    exclude: ['createdAt','updatedAt']
                },
                where: where,
                order: [
                    ['id']
                ]
            });

            translation.then(function (translations) {
                var persistedTranslation = {};

                translations.forEach(function(translation){
                    persistedTranslation[translation.label+'_'+translation.translation] = translation.translation;
                });
                language.translationMappingFile.forEach(function(translationMapping, index){
                    console.log(translationMapping)
                    if(!persistedTranslation[translationMapping.Label+'_'+translationMapping.Translation]){
                        var where = {};
                        where.label = translationMapping.Label;
                        where.type = language.aspect === 'Field Label' ? 'SObject-Label' : language.aspect === 'Fixed Label' ? 'Fixed-Label' : 'SObject-Section';
                        where.LanguageId = language.id;
                        if(language.aspect !== 'Fixed Label'){
                            where.SObjectId = language.SObject.id;
                        }
                        db.Translation.update({
                            translation: translationMapping.Translation
                        },{
                            where: where
                        }).then(function(updationCount){
                            if(updationCount > 0){
                                updatedRecordCount++;
                            }
                            if(language.translationMappingFile.length-1 == index){
                                global.languageconfig.refreshLanguageConfig();
                                generateResponse();
                            }
                        })
                        .catch(function(error) {
                            failedRecordCount++;
                            console.log(error);
                            if(language.translationMappingFile.length-1 == index){
                                global.languageconfig.refreshLanguageConfig();
                                generateResponse();
                            }
                        });
                    }
                    else{
                        failedRecordCount++;
                        if(language.translationMappingFile.length-1 == index){
                            global.languageconfig.refreshLanguageConfig();
                            generateResponse();
                        }
                    }
                });
            });    
        }
        else{
            return res.json({
                success: false,
                message: 'Please select proper file. There is some problem with file.'
            });
        }
    }
});
languageRouter.post('/exportlanguagetranslation', function(req, res){
    var language = req.body;
    var generateCSV = function(data){
        res.csv(data);
    };
    if(language === null || language === undefined || language.aspect === null || language.aspect === undefined){
        return res.json({
            success: false,
            message: 'No data found for language.'
        });
    } else {
        if(language.aspect !== 'Fixed Label' && (!language.SObject || !language.SObject === null || language.SObject.id === null || !language.SObject.id)){
            return res.json({
                success: false,
                message: 'No data found for language.'
            });
        }
        var where = {};
        if(language.aspect !== 'Fixed Label'){
            where.SObjectId = language.SObject.id;
        }
        where.type = language.aspect === 'Field Label' ? 'SObject-Label' : language.aspect === 'Fixed Label' ? 'Fixed-Label' : 'SObject-Section';
        where.LanguageId = language.id;
        var translation = db.Translation.findAll({
            attributes: {
                exclude: ['createdAt','updatedAt']
            },
            where: where,
            order: ['label']
        });
        var whereEngTranslation = {};
        if(language.aspect !== 'Fixed Label'){
            whereEngTranslation.SObjectId = language.SObject.id;
        }
        whereEngTranslation.type = language.aspect === 'Field Label' ? 'SObject-Label' : language.aspect === 'Fixed Label' ? 'Fixed-Label' : 'SObject-Section';
        whereEngTranslation.LanguageId = global.languageconfig.English.id;
        var englishTranslation = db.Translation.findAll({
            attributes: {
                exclude: ['createdAt','updatedAt']
            },
            where: whereEngTranslation,
            order: ['label']
        }); 
        translation.then(function (translations) {
            // Finding English Translation
            englishTranslation.then(function(englishTranslations){
                //English translation are default so it is mandatory
                //If English translation is not defined then we could not process further
                if(englishTranslations !== undefined && englishTranslations.length > 0){
                    //If translation is not defined then we will create it first
                    if(translations === undefined || (translations != undefined && translations.length === 0)){
                        var targetedTranslation = []
                        englishTranslations.forEach(function(englishTranslation) {
                            targetedTranslation.push({
                                label: englishTranslation.label, 
                                translation: englishTranslation.label, 
                                type: englishTranslation.type,
                                LanguageId: language.id,
                                SObjectId: englishTranslation.SObjectId,
                                SObjectLayoutSectionId: englishTranslation.SObjectLayoutSectionId
                            });
                        });
                        global.db.Translation.bulkCreate(targetedTranslation).then(function(){
                            //CSV generation logic
                            var csvData = [];
                            csvData.push({label: 'Label', translation: 'Translation'});
                            englishTranslations.forEach(function(englishTranslation) {
                                csvData.push({label: englishTranslation.label, translation: englishTranslation.translation});
                            });
                            return generateCSV(csvData);
                        });
                    }
                    //If translation is partially defined then we will sync it
                    else if(englishTranslations.length > translations.length){
                        var missingTranslations = [];
                        englishTranslations.forEach(function(engTranslation){
                            var isPresisted = false;
                            translations.forEach(function(otherTranslation){
                                if(engTranslation.label === otherTranslation.label){
                                    isPresisted = true;
                                    return;
                                }
                            });
                            if(!isPresisted){
                                missingTranslations.push({
                                    label: engTranslation.label, 
                                    translation: engTranslation.label, 
                                    type: engTranslation.type,
                                    LanguageId: language.id,
                                    SObjectId: engTranslation.SObjectId,
                                    SObjectLayoutSectionId: engTranslation.SObjectLayoutSectionId
                                });
                            }
                        });
                        global.db.Translation.bulkCreate(missingTranslations).then(function(){
                            //CSV generation logic
                            var csvData = [];
                            csvData.push({label: 'Label', translation: 'Translation'});
                            missingTranslations.forEach(function(missingTranslation) {
                                csvData.push({label: missingTranslation.label, translation: missingTranslation.translation});
                            });
                            return generateCSV(csvData);
                        });
                    }
                    //If everything is fine then we generate csv file
                    else{
                        //CSV generation logic
                        var csvData = [];
                        csvData.push({label: 'Label', translation: 'Translation'});
                        translations.forEach(function(translation) {
                            csvData.push({label: translation.label, translation: translation.translation});
                        });
                        return generateCSV(csvData);
                    }
                }
                else{
                    return res.json({
                        success: false,
                        message: 'Unable to continue translation file generation. Default language is missing. Please re-configure SObjects.'
                    });
                }
            });
        })
    }         
});
languageRouter.post('/markasdefault', function(req, res){
    var language = req.body;
    if(language === null || language === undefined){
        return res.json({
            success: false,
            message: 'No data found for language.'
        });
    } else {
        db.Language.update({
            default: false
        },
        {
            where: {}
        }).then(function(){
            db.Language.update({
                default: true,
                active: true
            },{
                where: {
                    id: language.id
                }
            }).then(function(){
                return res.json({
                    success: true
                });
            });       
        });
    }
});

languageRouter.post('/changeactive', function(req, res){
    var Language = req.body;
    db.Language.update({
        active: Language.active
    },{
        where: {
            id: Language.id
        }
    }).then(function(){
        languageconfig.refreshLanguageConfig();
        return res.json({
            success: true
        });
    });
});

module.exports = languageRouter;