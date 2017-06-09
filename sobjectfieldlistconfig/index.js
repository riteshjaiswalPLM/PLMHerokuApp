sObjectFieldListConfig ={};
sObjectFieldListConfig.FieldListMap={};
sObjectFieldListConfig.sObjectFieldLabelMapping={};
sObjectFieldListConfig.refreshConfig = ()=>{
    var layoutListMetaArray = [];
    var sObjectDetails = db.SObjectLayout.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        include:{
            model: db.SObject,
            attributes:{
                include: ['name']
            }
        },
        where: {
            type :{
                $ne : 'Mobile'
            },
            // created: true,
            // active: true
        },
        order: ['SObjectId']
    }).then((layouts)=>{
        // console.log(layouts);
        var layoutMetaData, relatedListMetaData;
        async.each(layouts, (layout, callback)=>{
            sObjectFieldListConfig.FieldListMap[layout.SObject.name+'-'+layout.type] = ['Id'];
            if(layout.type === 'List'){
                layoutMetaData = db.SObjectLayoutField.findAll({
                    include: [{
                        model: db.SObjectField,
                        attributes: {
                            exclude: ['createdAt','updatedAt']
                        }
                    }],
                    attributes: {
                        exclude: ['createdAt','updatedAt']
                    },
                    where: {
                        SObjectLayoutId: layout.id,
                        type: {
                            $in: ['Search-Criteria-Field','Search-Result-Field']
                        }
                    },
                    order: [
                        ['order']
                    ]
                });
                relatedListMetaData = undefined;
            }
            else if(layout.type === 'Edit' || layout.type === 'Details' || layout.type === 'Create'){
                layoutMetaData = db.SObjectLayoutSection.findAll({
                    include: [{
                        model: db.SObjectLayoutField,
                        include: [{
                            model: db.SObjectField,
                            attributes: {
                                exclude: ['createdAt','updatedAt']
                            }
                        },{
                            model: db.SObjectField,
                            as: 'ControllerSObjectField',
                            attributes: {
                                exclude: ['createdAt','updatedAt']
                            }
                        }],
                        attributes: {
                            exclude: ['createdAt','updatedAt']
                        }
                    },{
                        model: db.Components,
                        include: [{
                            model: db.ComponentDetail,
                            attributes: {
                                exclude: ['createdAt','updatedAt']
                            }
                        }],
                        attributes: {
                            exclude: ['createdAt','updatedAt']
                        }
                    }],
                    attributes: {
                        exclude: ['createdAt','updatedAt']
                    },
                    where: {
                        SObjectLayoutId: layout.id,
                        active: true
                    },
                    order: [
                        ['order'],
                        [db.SObjectLayoutField, 'order']
                    ]
                });

                if(layout.type !== 'Create'){
                    relatedListMetaData = global.db.SObjectLayoutRelatedList.findAll({
                        include: [{
                            model: db.SObjectLayoutField,
                            include: {
                                model: db.SObjectField,
                                attributes: {
                                    exclude: ['createdAt','updatedAt']
                                }
                            },
                            attributes: {
                                exclude: ['createdAt','updatedAt']
                            }
                        },{
                            model: db.SObject,
                            attributes: {
                                exclude: ['createdAt','updatedAt']
                            }
                        },{
                            model: db.SObjectField,
                            attributes: {
                                exclude: ['createdAt','updatedAt']
                            }
                        }],
                        attributes: {
                            exclude: ['createdAt','updatedAt']
                        },
                        where: {
                            SObjectLayoutId: layout.id,
                            active: true
                        },
                        order: [
                            ['order'],
                            [db.SObjectLayoutField, 'order']
                        ]
                    });
                }
                else{
                    relatedListMetaData = undefined;
                }
            }
            layoutListMetaArray.push({layout: layout, layoutMetaData: layoutMetaData, relatedListMetaData: relatedListMetaData});

            callback();
        },()=>{
            // console.log(layoutListMetaArray);
            async.each(layoutListMetaArray,(layoutListMeta, callback)=>{
                layoutListMeta.layoutMetaData.then((resultMetaData)=>{
                    if(layoutListMeta.layout.type !== 'List'){
                        var layoutSections = JSON.parse(JSON.stringify(resultMetaData));
                        layoutSections.forEach(function(section){
                            if(section.isComponent){
                                if(section.Component === null && section.ComponentId === null){
                                    var fileName=section.componentName.toLowerCase().replace(/\s/g,"-");
                                    staticcomponentconfig.list.forEach(function (component) {
                                        if (component.name == fileName) {
                                            JSON.parse(component.config).fields.forEach((field)=>{
                                                if(field.criteria !== undefined){
                                                    var fieldList = extractFieldFromCriteria(field.criteria,[]);
                                                    fieldList.forEach((fieldFromCriteria)=>{
                                                        if(sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                            sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].push(fieldFromCriteria.SObjectField.name);
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                                else if(section.Component !== null && section.ComponentId !== null){
                                    if(section.componentName === 'MultiLevelApproval'){
                                        if(sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName] === undefined){
                                            sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName] = ['Id']
                                        }
                                        if(section.Component.ComponentDetails[0].configuration.addFinalApproverCriteria !== null){
                                            var fieldList = extractFieldFromCriteria(section.Component.ComponentDetails[0].configuration.addFinalApproverCriteria, [], layoutListMeta.layout.SObject.name);
                                            fieldList.forEach((fieldFromCriteria)=>{
                                                if(sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                    sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].push(fieldFromCriteria.SObjectField.name);
                                                }
                                            });
                                            var newfieldList = extractFieldFromCriteria(section.Component.ComponentDetails[0].configuration.addFinalApproverCriteria, [], section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName);
                                            newfieldList.forEach((fieldFromCriteria)=>{
                                                if(sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                    sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName].push(fieldFromCriteria.SObjectField.name);
                                                }
                                            });
                                        }
                                        if(section.Component.ComponentDetails[0].configuration.allowAddMoreCriteria !== null){
                                            var fieldList = extractFieldFromCriteria(section.Component.ComponentDetails[0].configuration.allowAddMoreCriteria, [], layoutListMeta.layout.SObject.name);
                                            fieldList.forEach((fieldFromCriteria)=>{
                                                if(sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                    sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].push(fieldFromCriteria.SObjectField.name);
                                                }
                                            });
                                            var newfieldList = extractFieldFromCriteria(section.Component.ComponentDetails[0].configuration.allowAddMoreCriteria, [], section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName);
                                            newfieldList.forEach((fieldFromCriteria)=>{
                                                if(sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                    sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName].push(fieldFromCriteria.SObjectField.name);
                                                }
                                            });
                                        }
                                        if(section.Component.ComponentDetails[0].configuration.deleteCriteria !== null){
                                            var fieldList = extractFieldFromCriteria(section.Component.ComponentDetails[0].configuration.deleteCriteria, [], layoutListMeta.layout.SObject.name);
                                            fieldList.forEach((fieldFromCriteria)=>{
                                                if(sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                    sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].push(fieldFromCriteria.SObjectField.name);
                                                }
                                            });
                                            var newfieldList = extractFieldFromCriteria(section.Component.ComponentDetails[0].configuration.deleteCriteria, [], section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName);
                                            newfieldList.forEach((fieldFromCriteria)=>{
                                                if(sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                    sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName].push(fieldFromCriteria.SObjectField.name);
                                                }
                                            });
                                        }
                                        if(section.Component.ComponentDetails[0].configuration.recallCriteria !== null){
                                            var fieldList = extractFieldFromCriteria(section.Component.ComponentDetails[0].configuration.recallCriteria, [], layoutListMeta.layout.SObject.name);
                                            fieldList.forEach((fieldFromCriteria)=>{
                                                if(sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                    sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].push(fieldFromCriteria.SObjectField.name);
                                                }
                                            });
                                            var newfieldList = extractFieldFromCriteria(section.Component.ComponentDetails[0].configuration.recallCriteria, [], section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName);
                                            newfieldList.forEach((fieldFromCriteria)=>{
                                                if(sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                    sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName].push(fieldFromCriteria.SObjectField.name);
                                                }
                                            });
                                        }
                                        section.Component.ComponentDetails[0].configuration.fields.forEach((field)=>{
                                            if(field.criteria !== null){
                                                var fieldList = extractFieldFromCriteria(field.criteria, [], layoutListMeta.layout.SObject.name);
                                                fieldList.forEach((fieldFromCriteria)=>{
                                                    if(sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                        sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].push(fieldFromCriteria.SObjectField.name);
                                                    }
                                                });
                                                var newfieldList = extractFieldFromCriteria(field.criteria, [], section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName);
                                                newfieldList.forEach((fieldFromCriteria)=>{
                                                    if(sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                        sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName].push(fieldFromCriteria.SObjectField.name);
                                                    }
                                                });
                                            }
                                            if(field.readOnly === true && field.readOnlyCriteria !== null){
                                                var fieldList = extractFieldFromCriteria(field.readOnlyCriteria, [], layoutListMeta.layout.SObject.name);
                                                fieldList.forEach((fieldFromCriteria)=>{
                                                    if(sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                        sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].push(fieldFromCriteria.SObjectField.name);
                                                    }
                                                });
                                                var newfieldList = extractFieldFromCriteria(field.readOnlyCriteria, [], section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName);
                                                newfieldList.forEach((fieldFromCriteria)=>{
                                                    if(sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                        sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName].push(fieldFromCriteria.SObjectField.name);
                                                    }
                                                });
                                            }
                                            if(field.isRequired === true && field.requiredCriteria !== null){
                                                var fieldList = extractFieldFromCriteria(field.requiredCriteria, [], layoutListMeta.layout.SObject.name);
                                                fieldList.forEach((fieldFromCriteria)=>{
                                                    if(sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                        sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].push(fieldFromCriteria.SObjectField.name);
                                                    }
                                                });
                                                var newfieldList = extractFieldFromCriteria(field.requiredCriteria, [], section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName);
                                                newfieldList.forEach((fieldFromCriteria)=>{
                                                    if(sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                        sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName].push(fieldFromCriteria.SObjectField.name);
                                                    }
                                                });
                                            }
                                            if(sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName].indexOf(field.SObjectField.name) === -1){
                                                sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName].push(field.SObjectField.name);
                                            }
                                            if(field.SObjectField.type === 'reference' && sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName].indexOf(field.SObjectField.relationshipName+'.'+field.reference) === -1){
                                                sObjectFieldListConfig.FieldListMap[section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName].push(field.SObjectField.relationshipName+'.'+field.reference)
                                            }
                                        });
                                    }
                                }
                            }
                            else{
                                section.SObjectLayoutFields.forEach((field)=>{
                                    if(sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].indexOf(field.SObjectField.name) === -1){
                                        sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].push(field.SObjectField.name);
                                        if(field.SObjectField.type === 'reference'){
                                            sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].push(field.SObjectField.relationshipName+'.'+field.reference);
                                        }
                                    }
                                    if(field.criteria !== null){
                                        var fieldList = extractFieldFromCriteria(field.criteria,[]);
                                        fieldList.forEach((fieldFromCriteria)=>{
                                            if(sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].push(fieldFromCriteria.SObjectField.name);
                                            }
                                        });
                                    }
                                    if(field.requiredCriteria !== null){
                                        var fieldList = extractFieldFromCriteria(field.requiredCriteria,[]);
                                        fieldList.forEach((fieldFromCriteria)=>{
                                            if(sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].push(fieldFromCriteria.SObjectField.name);
                                            }
                                        });
                                    }
                                });
                                if(section.criteria !== null){
                                    var fieldList = extractFieldFromCriteria(section.criteria,[]);
                                    fieldList.forEach((fieldFromCriteria)=>{
                                        if(sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                            sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].push(fieldFromCriteria.SObjectField.name);
                                        }
                                    });
                                }
                            }
                        });
                        if(layoutListMeta.layout.type !== 'Create'){
                            layoutListMeta.relatedListMetaData.then((resultRelatedListMetaData)=>{
                                // console.log(resultRelatedListMetaData);
                                resultRelatedListMetaData.forEach((resultRelatedListMeta)=>{
                                    if(resultRelatedListMeta.criteria != null){
                                        var fieldList = extractFieldFromCriteria(resultRelatedListMeta.criteria,[]);
                                        fieldList.forEach((fieldFromCriteria)=>{
                                            if(sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].push(fieldFromCriteria.SObjectField.name);
                                            }
                                        }); 
                                    }
                                    resultRelatedListMeta.SObjectLayoutFields.forEach((field)=>{
                                        if(field.criteria != null){
                                            var fieldList = extractFieldFromCriteria(field.criteria,[]);
                                            fieldList.forEach((fieldFromCriteria)=>{
                                                if(sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].indexOf(fieldFromCriteria.SObjectField.name) === -1){
                                                    sObjectFieldListConfig.FieldListMap[layoutListMeta.layout.SObject.name+'-'+layoutListMeta.layout.type].push(fieldFromCriteria.SObjectField.name);
                                                }
                                            }); 
                                        }
                                    });
                                });
                            });
                        }
                    }
                });
                callback();
            },
            ()=>{
                // console.log(sObjectFieldListConfig.FieldListMap);
            });
        });
    });
    
};

var extractFieldFromCriteria = function(criteria, field, sObjectName){
    _sObjectName = sObjectName;
    var strCriteria = JSON.stringify(criteria);
    var andGroupNode = {
        type		:'GROUP',
        operator	:'&&',
        rules		:[{
            type		:'RULE',
            field		:null
        }]
    }, orGroupNode = {
        type		:'GROUP',
        operator	:'||',
        rules		:[{
            type		:'RULE',
            field		:null
        }]
    }
    if(strCriteria == andGroupNode || strCriteria == orGroupNode){
        return null;
    }
    criteria.group.rules.forEach(function(rule){
        if(rule.group){
            extractFieldFromCriteria(rule, field);
        }else{
            var contd = true;
            if(rule.SObjectName !== undefined){
                if(rule.SObjectName.split('-')[0] !== _sObjectName){
                    contd = false;
                }
            }
            if(rule.field && contd === true){
                field.push(rule.field);
            }
        }
    });
    return field;
}

sObjectFieldListConfig.refreshFieldLabelMappingConfig = ()=>{
    var sObjectDetails = db.SObject.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        include: {
            model: db.SObjectField,
            attributes: {
                exclude: ['createdAt','updatedAt']
            },
        },
    });
    sObjectDetails.then(function(_sObjectDetails){
        var sobjectFieldMap={}
        _sObjectDetails.forEach(function(sObject){
            var fieldsNameLabelMapping={};
            sObject.SObjectFields.forEach(function(fields){
                fieldsNameLabelMapping[fields.name]=fields.label;
            });
            sobjectFieldMap[sObject.name]=fieldsNameLabelMapping;
        });
        sObjectFieldListConfig.sObjectFieldLabelMapping=sobjectFieldMap;
    });
}
sObjectFieldListConfig.refreshConfig();
sObjectFieldListConfig.refreshFieldLabelMappingConfig();
module.exports = sObjectFieldListConfig;