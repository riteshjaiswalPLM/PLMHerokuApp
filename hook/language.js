module.exports = function(){
    global.db.SObject.afterCreate(function(newSObject) {
        var engTranslation = [];
        engTranslation.push({
            label: newSObject.label, 
            translation: newSObject.label,
            type: 'SObject-Label', 
            LanguageId: global.languageconfig.English.id,
            SObjectId: newSObject.id
        });
        engTranslation.push({
            label: 'Create ' + newSObject.label, 
            translation: 'Create ' + newSObject.label,
            type: 'SObject-Label', 
            LanguageId: global.languageconfig.English.id,
            SObjectId: newSObject.id
        });
        engTranslation.push({
            label: 'Search ' + newSObject.label, 
            translation: 'Search ' + newSObject.label,
            type: 'SObject-Label', 
            LanguageId: global.languageconfig.English.id,
            SObjectId: newSObject.id
        });
        engTranslation.push({
            label: 'Edit ' + newSObject.label, 
            translation: 'Edit ' + newSObject.label,
            type: 'SObject-Label', 
            LanguageId: global.languageconfig.English.id,
            SObjectId: newSObject.id
        });
        engTranslation.push({
            label: newSObject.label + ' Detail', 
            translation: newSObject.label + ' Detail',
            type: 'SObject-Label', 
            LanguageId: global.languageconfig.English.id,
            SObjectId: newSObject.id
        });
        engTranslation.push({
            label: newSObject.labelPlural, 
            translation: newSObject.labelPlural,
            type: 'SObject-Label', 
            LanguageId: global.languageconfig.English.id,
            SObjectId: newSObject.id
        });
        global.db.Translation.bulkCreate(engTranslation);
    });

    global.db.SObjectField.afterBulkCreate(function(sObjectFields){
        var engTranslation = [];
        sObjectFields.forEach(function(sObjectField){
            engTranslation.push({
                label: sObjectField.label, 
                translation: sObjectField.label, 
                type: 'SObject-Label',
                LanguageId: global.languageconfig.English.id,
                SObjectId: sObjectField.SObjectId
            });
        });
        global.db.Translation.bulkCreate(engTranslation);
    });

    global.db.SObject.beforeDestroy(function(sObject){
        global.db.Translation.destroy({
            where: {
                SObjectId: sObject.id
            }
        });
    });
    global.db.SObjectLayoutSection.beforeBulkDestroy(function(sObjectLayoutSections){
        console.log("bulk destroy called");
    });
    global.db.SObjectLayoutSection.beforeDestroy(function(sObjectLayoutSections){
        global.db.Translation.destroy({
            where: {
                type: 'SObject-Section', 
                SObjectLayoutSectionId: sObjectLayoutSections.id
            }
        });
    });

    global.db.SObjectLayoutSection.afterCreate(function(newSection){
        getSObjectLayoutDetails(newSection.SObjectLayoutId, function(sObjectLayout){
            global.db.Translation.build({
                label: newSection.title, 
                translation: newSection.title,
                type: 'SObject-Section', 
                LanguageId: global.languageconfig.English.id,
                SObjectId: sObjectLayout.SObjectId,
                SObjectLayoutSectionId: newSection.id
            }).save();
        })
    });

    global.db.SObjectLayoutSection.afterUpdate(function(section){
        global.db.Translation.update({
            label: section.title, 
            translation: section.title,
            type: layoutSection.type, 
            LanguageId: layoutSection.LanguageId,
            SObjectId: sObjectLayout.SObjectId,
            SObjectLayoutSectionId: section.id
        },{
            where: {
                SObjectLayoutSectionId: section.id
            }
        });
    });

    global.db.SObjectLayoutRelatedList.afterCreate(function(newSection){
        getSObjectLayoutDetails(newSection.SObjectLayoutId, function(sObjectLayout){
            global.db.Translation.build({
                label: newSection.title, 
                translation: newSection.title,
                type: 'SObject-Section', 
                LanguageId: global.languageconfig.English.id,
                SObjectId: sObjectLayout.SObjectId,
                SObjectLayoutSectionId: newSection.id
            }).save();
        })
    });
    global.db.SObjectLayoutRelatedList.afterUpdate(function(section){
        global.db.Translation.update({
            label: section.title, 
            translation: section.title,
            type: layoutSection.type, 
            LanguageId: layoutSection.LanguageId,
            SObjectId: sObjectLayout.SObjectId,
            SObjectLayoutSectionId: section.id
        },{
            where: {
                SObjectLayoutSectionId: section.id
            }
        });
    });
    global.db.SObjectLayoutRelatedList.beforeDestroy(function(sObjectLayoutSections){
        global.db.Translation.destroy({
            where: {
                type: 'SObject-Section', 
                SObjectLayoutSectionId: sObjectLayoutSections.id
            }
        });
    });

    global.db.SObjectLayoutField.afterUpdate(function(sObjectLayoutField){
        console.log(sObjectLayoutField['_previousDataValues']);
        if(sObjectLayoutField.label !== sObjectLayoutField['_previousDataValues'].label){
            global.db.Translation.update({
                label: sObjectLayoutField.label, 
                translation: sObjectLayoutField.label
            },{
                where: {
                    label: sObjectLayoutField['_previousDataValues'].label
                }
            });
        }
    });

    global.db.SObjectLayoutField.afterBulkCreate(function(sObjectLayoutFields){
        getSObjectLayoutDetails(sObjectLayoutFields[0].SObjectLayoutId, function(sObjectLayout){
            sObjectLayoutFields.forEach(function(sObjectLayoutField){
                global.db.Translation.findOne({
                    where: {
                        label: sObjectLayoutField.label
                    }
                }).then(function(result){
                    if(!result || (result && result.length === 0)){
                        global.db.Translation.build({
                            label: sObjectLayoutField.label, 
                            translation: sObjectLayoutField.label,
                            type: 'SObject-Label', 
                            LanguageId: global.languageconfig.English.id,
                            SObjectId: sObjectLayout.SObjectId
                        }).save();
                    }
                });
            });
        });
    });

    global.db.Components.afterCreate(function(newComponent){
        global.db.Translation.build({
            label: newComponent.title, 
            translation: newComponent.title,
            type: 'SObject-Section', 
            LanguageId: global.languageconfig.English.id,
            SObjectId: newComponent.SObjectId,
            ComponentId: newComponent.id
        }).save();
    });
    global.db.Components.afterBulkUpdate(function(components){
        getComponent(components.where.id, function(component){
            if (component!=null ){
                global.db.Translation.update({
                    label: component.title, 
                    translation: component.title,
                    SObjectId: component.SObjectId,
                    ComponentId: component.id
                },{
                    where: {
                        type: 'SObject-Section', 
                        ComponentId: component.id
                    }
                }).then(function(result){
                    if(result==0){
                        global.db.Translation.build({
                            label: component.title, 
                            translation: component.title,
                            type: 'SObject-Section', 
                            LanguageId: global.languageconfig.English.id,
                            SObjectId: component.SObjectId,
                            ComponentId: component.id
                        }).save();
                    }
                    else{
                        console.log('Record Found')
                    }
                });
            }
        });
    });
    global.db.Components.beforeBulkDestroy(function(Component){
        global.db.Translation.destroy({
            where: {
                type: 'SObject-Section', 
                ComponentId: Component.id
            }
        });
    });
    global.db.ComponentDetail.afterCreate(function(newComponent){
        if(newComponent.configuration!=null && newComponent.configuration!=undefined){
            if(newComponent.configuration.fields!=null && newComponent.configuration.fields!=undefined){
                newComponent.configuration.fields.forEach(function(field){
                    if(field.label!=null && field.label!=undefined && field.SObjectField!=null && field.SObjectField!=undefined){
                        global.db.Translation.build({
                            label: field.label, 
                            translation: field.label,
                            type: 'SObject-Label', 
                            LanguageId: global.languageconfig.English.id,
                            SObjectId: field.SObjectField.SObjectId,
                            ComponentId: newComponent.ComponentId
                        }).save();
                    }
                });
            }
        }
    });

    global.db.ComponentDetail.afterBulkUpdate(function(newComponent){
        getComponentDetails(newComponent.where.id, function(componentDetail){
            global.db.Translation.destroy({
                where: {
                    type: 'SObject-Label', 
                    ComponentId: componentDetail.ComponentId
                }
            }).then(function(decRec){
                if(componentDetail.configuration!=null && componentDetail.configuration!=undefined){
                    if(componentDetail.configuration.fields!=null && componentDetail.configuration.fields!=undefined){
                        componentDetail.configuration.fields.forEach(function(field){
                            if(field.label!=null && field.label!=undefined && field.SObjectField!=null && field.SObjectField!=undefined){
                                global.db.Translation.build({
                                    label: field.label, 
                                    translation: field.label,
                                    type: 'SObject-Label', 
                                    LanguageId: global.languageconfig.English.id,
                                    SObjectId: field.SObjectField.SObjectId,
                                    ComponentId: componentDetail.ComponentId
                                }).save();
                            }
                        });
                    }
                }
            });
        });
    });
    
    global.db.ComponentDetail.beforeDestroy(function(Component){
        global.db.Translation.destroy({
            where: {
                type: 'SObject-Label', 
                ComponentId: Component.ComponentId
            }
        });
    });
};

var getSObjectLayoutDetails = function(sObjectLayoutId, callback){
    global.db.SObjectLayout.findOne({attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: {
            id: sObjectLayoutId
        } 
    }).then(function(sObjectLayout){
        callback && callback(sObjectLayout);
    });
};
var getComponentDetails = function(ComponentDetailId, callback){
    global.db.ComponentDetail.findOne({attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: {
            id: ComponentDetailId
        } 
    }).then(function(componentDetail){
        callback && callback(componentDetail);
    });
};
var getComponent = function(ComponentId, callback){
    global.db.Components.findOne({attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: {
            id: ComponentId
        } 
    }).then(function(component){
        callback && callback(component);
    });
};