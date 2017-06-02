var express = require('express');
var mobileConfRouter = express.Router();
var request = require('request');

var createGroupExpression = function(criteria,exp,operator){
    exp += "(";
    criteria.group.rules.forEach(function(rule){
        exp += rule.group ? createGroupExpression(rule,"",rule.group.operator) : createRuleExpression(rule);
        exp += " " + operator.replace(/\&\&/g,'AND').replace(/\|\|/g,'OR') + " ";
    });
    exp = exp.slice(0,-4);
    if(exp !== "")
        exp += ")";
    return exp;
};

var createRuleExpression = function(rule){
    var exp = "";
    if(rule.field){
        var modelValue = rule.field.SObjectField.name ;
        var ruleValue = rule.data[rule.field.SObjectField.name];
        var type=rule.field.SObjectField.type;
        if(rule.data.fieldname){
            if(rule.field.SObjectField.relationshipName !== null && rule.field.SObjectField.relationshipName){
                modelValue = rule.field.SObjectField.relationshipName + '.' + rule.data.fieldname;	
            }
            type="picklist";
        }
        switch(type){
            case "double":
            case "currency":
                ruleValue 	= (ruleValue) 	? ruleValue 	: 0;
                break;
                
            case "string":
            case "email":
            case "picklist":
                ruleValue 	= (ruleValue) 	? "'" + ruleValue 	+ "'" : "''";
                break;

            case "reference":
                ruleValue 	= (ruleValue) 	? "'" + ruleValue.substr(0,15) 	+ "'" : "''"
                break;
            
            case "boolean":
                ruleValue 	= (ruleValue) 	? ruleValue 	: false;
                break;
        }
        exp += "(" + modelValue + " " + rule.condition.replace(/==/g,"=") + " " + ruleValue + ")";
    }
    return exp;
};

var getMobileConfig = function(callback){
    var SObjectsGovern, SObjectsSearchConfig,UserActionField,pickListConfig, mobileMyTaskComponents,mobileOrgDetail;
    var SObjects = global.db.SObject.findAll({
        attributes:
        ['id', 'name', 'label', 'labelPlural', 'keyPrefix', 'custom', 'customSetting', 'createable', 'deletable', 'layoutable', 'mergeable', 'queryable', 'replicateable', 'retrieveable', 'updateable']
        ,
        include: {
            model: global.db.SObjectField,
            attributes: ['picklistValues', 'referenceTo', 'id', 'name', 'label', 'custom', 'aggregatable', 'autoNumber', 'byteLength', 'calculated', 'calculatedFormula', 'controllerName', 'createable', 'defaultValue', 'defaultValueFormula', 'dependentPicklist', 'digits', 'encrypted', 'externalId', 'extraTypeInfo', 'filterable', 'highScaleNumber', 'htmlFormatted', 'idLookup', 'inlineHelpText', 'length', 'mask', 'maskType', 'nameField', 'namePointing', 'nillable', 'precision', 'referenceTargetField', 'relationshipName', 'restrictedDelete', 'restrictedPicklist', 'scale', 'sortable', 'type', 'unique', 'updateable', 'SObjectId'],
            where: {
                forMobile: true
            }
        },
        where: {
            forMobile: true
        }
    });


    SObjects.then(function (sObjects) {
        var objectMetadata = {}, governField = {}, objectSearchConfig = {},userActionConfig={};
        sObjects.forEach(function (sObject) {
            objectMetadata[sObject.name] = {};
            objectMetadata[sObject.name].sObject = {};

            Object.keys(sObject.dataValues).forEach((sObjectkey) => {
                if (sObjectkey != "SObjectFields") {
                    objectMetadata[sObject.name].sObject[sObjectkey] = sObject[sObjectkey];
                }
            });
            objectMetadata[sObject.name].sObjectFields = sObject.SObjectFields;

        });

        SObjectsGovern = global.db.SObject.findAll({
            attributes: ['name'],
            include: {
                model: global.db.SObjectField,
                attributes: ['name'],
                where: {
                    forMobile: true,
                    isGovernField: true
                }
            },
            where: {
                forMobile: true
            },
            order: [
                [ global.db.SObjectField, 'label', 'ASC' ],
            ]
        });

        SObjectsGovern.then(function (sObjectsGovern) {
            sObjectsGovern.forEach(function (sObjectsGovernField) {
                if (sObjectsGovernField.SObjectFields != undefined) {
                    governField[sObjectsGovernField.name] = [];
                    sObjectsGovernField.SObjectFields.forEach(function (Field) {
                        governField[sObjectsGovernField.name].push(Field.name);
                    });
                }
            });

            SObjectsSearchConfig = global.db.SObject.findAll({
                attributes: ['name'],
                include: {
                    model: global.db.SObjectLayout,
                    attributes: ['id', 'whereClause'],
                    include: {
                        model: global.db.SObjectLayoutField,
                        attributes: ['id', 'type', 'reference', 'hidden'],
                        include: {
                            model: global.db.SObjectField,
                            attributes: ['name', ['relationshipName', 'relationName'], 'type'],
                            where: {
                                forMobile: true
                            }
                        },
                        where: {
                            type: {
                                $in: ['Search-Criteria-Field', 'Search-Result-Field']
                            }
                        }
                    },
                    where: {
                        type: 'Mobile',
                        active: true
                    }
                },
                where: {
                    forMobile: true
                },
                order: [
                    [ global.db.SObjectLayout, global.db.SObjectLayoutField, 'order', 'ASC' ],
                ]
            });

            SObjectsSearchConfig.then(function (searchConfig) {
                searchConfig.forEach(function (sObjectsSearchConfigField) {
                    if (sObjectsSearchConfigField.SObjectLayouts[0].SObjectLayoutFields != undefined) {
                        objectSearchConfig[sObjectsSearchConfigField.name] = {};
                        objectSearchConfig[sObjectsSearchConfigField.name].crateria = [];
                        objectSearchConfig[sObjectsSearchConfigField.name].result = [];
                        objectSearchConfig[sObjectsSearchConfigField.name].displayFields = [];
                        if (sObjectsSearchConfigField.SObjectLayouts[0].whereClause != null) {
                            objectSearchConfig[sObjectsSearchConfigField.name].defaultCriteria = sObjectsSearchConfigField.SObjectLayouts[0].whereClause;
                        } else {
                            objectSearchConfig[sObjectsSearchConfigField.name].defaultCriteria = "";
                        }
                        sObjectsSearchConfigField.SObjectLayouts[0].SObjectLayoutFields.forEach(function (Field) {
                            if (Field.type === "Search-Criteria-Field") {
                                objectSearchConfig[sObjectsSearchConfigField.name].crateria.push(Field.SObjectField.name);
                            }
                            else {
                                objectSearchConfig[sObjectsSearchConfigField.name].result.push(Field.SObjectField.name);
                                if (Field.hidden === false) {
                                    if (Field.SObjectField.type === 'reference' && Field.reference !== undefined) {
                                        objectSearchConfig[sObjectsSearchConfigField.name].displayFields.push(JSON.parse(JSON.stringify(Field.SObjectField))["relationName"] + '.' + Field.reference);
                                    } else {
                                        objectSearchConfig[sObjectsSearchConfigField.name].displayFields.push(Field.SObjectField.name);
                                    }
                                }
                            }
                        });
                    }
                });
                

                UserActionField = global.db.UserActionField.findAll({
                    include: [{
                        model: db.SObjectField,
                        attributes:['name']
                    },
                    {
                        model: db.UserAction,
                        attributes: ['actionvalue'],
                        include: {
                            model: global.db.SObject,
                            attributes: ['id', 'name', 'label'],
                        }
                    }
                    ],
                    attributes: {
                        exclude: ['createdAt', 'updatedAt']
                    },
                });

                UserActionField.then(function (userAction) {
                    
                    userAction.forEach(function (userActionField) {
                        if (userActionField.UserAction.SObject != undefined) {
                            if(userActionConfig[userActionField.UserAction.SObject.name] == undefined){
                                userActionConfig[userActionField.UserAction.SObject.name] = {};
                            }
                            if(userActionConfig[userActionField.UserAction.SObject.name][userActionField.UserAction.actionvalue] == undefined){
                                userActionConfig[userActionField.UserAction.SObject.name][userActionField.UserAction.actionvalue]={};
                                userActionConfig[userActionField.UserAction.SObject.name][userActionField.UserAction.actionvalue].optional=[];
                                userActionConfig[userActionField.UserAction.SObject.name][userActionField.UserAction.actionvalue].readOnly=[];
                                userActionConfig[userActionField.UserAction.SObject.name][userActionField.UserAction.actionvalue].mandatory=[];
                            }
                            if(userActionField.type == 'Optional')
                                userActionConfig[userActionField.UserAction.SObject.name][userActionField.UserAction.actionvalue].optional.push(userActionField.SObjectField.name);
                            if(userActionField.type == 'Readonly')
                                userActionConfig[userActionField.UserAction.SObject.name][userActionField.UserAction.actionvalue].readOnly.push(userActionField.SObjectField.name);
                            if(userActionField.type == 'Required')
                                userActionConfig[userActionField.UserAction.SObject.name][userActionField.UserAction.actionvalue].mandatory.push(userActionField.SObjectField.name);
                        
                        }
                    });

                    var inClause = [];
                    db.Components.rawAttributes.catagory.values.forEach((value, index)=>{
                        if(value.indexOf('Dashboard') > -1)
                            inClause.push(value);
                    });
                    var where = {catagory: {$in: inClause}, forMobile: true, active: true};
                    db.Components.findAll({
                        include: [{
                            model: db.ComponentDetail,
                            attributes: {
                                exclude: ['createdAt','updatedAt']
                            }
                        },{
                            model: db.SObject,
                            attributes: {
                                exclude: ['createdAt','updatedAt']
                            }
                        },{
                            model: db.SObject,
                            as: "detailSObject",
                            attributes: {
                                exclude: ['createdAt','updatedAt']
                            }
                        }],
                        attributes: {
                            exclude: ['createdAt','updatedAt']
                        },
                        where: where,
                        order: [
                            ['id','ASC'],
                            ['catagory','ASC']
                        ]
                    })
                    .then((myTaskComponents)=>{
                        var myTaskConfig = []
                        myTaskComponents.forEach((myTaskComponent)=>{
                            var taskConfig = {
                                title: "",
                                query: "",
                                displayFields: [],
                                mainObject: "",
                                detailObject: "",
                                idField: "",
                                userMapping: {
                                    assignUser: "",
                                    assignRole: ""
                                },
                                governFieldMapping:{}
                            };
                            taskConfig.title = myTaskComponent.title;
                            taskConfig.mainObject = myTaskComponent.SObject.name;
                            taskConfig.detailObject = myTaskComponent.detailSObject ? myTaskComponent.detailSObject.name : myTaskComponent.SObject.name;
                            taskConfig.idField = myTaskComponent.detailSObject && myTaskComponent.ComponentDetails[0].configuration.relativeField ? myTaskComponent.ComponentDetails[0].configuration.relativeField.name : 'Id';
                            taskConfig.query = "Select Id, ", fieldsLength = myTaskComponent.ComponentDetails[0].configuration.fields.length;
                            myTaskComponent.ComponentDetails[0].configuration.fields.forEach((field, index)=>{
                                if(field.SObjectField.type === 'reference' && field.reference !== undefined){
                                    taskConfig.query += field.SObjectField.relationshipName + '.' + field.reference; 
                                    if(field.isUserNameField){
                                        taskConfig.userMapping.assignUser = field.SObjectField.relationshipName + '.' + field.reference;
                                    }
                                    if(field.isAssignedRoleField){
                                        taskConfig.userMapping.assignRole = field.SObjectField.relationshipName + '.' + field.reference;
                                    }
                                    if(field.governFieldName !== null){
                                        taskConfig.governFieldMapping[field.governFieldName] = field.SObjectField.relationshipName + '.' + field.reference;
                                    }
                                }
                                else{
                                    taskConfig.query += field.SObjectField.name;
                                    if(field.isUserNameField){
                                        taskConfig.userMapping.assignUser = field.SObjectField.name;
                                    }
                                    if(field.isAssignedRoleField){
                                        taskConfig.userMapping.assignRole = field.SObjectField.name;
                                    }
                                    if(field.governFieldName !== null){
                                        taskConfig.governFieldMapping[field.governFieldName] = field.SObjectField.name;
                                    }
                                }
                                if(index < fieldsLength-1){
                                    taskConfig.query += ", ";
                                }
                                if(field.hidden === false){
                                    if(field.SObjectField.type === 'reference' && field.reference !== undefined)
                                        taskConfig.displayFields.push(field.SObjectField.relationshipName + '.' + field.reference);
                                    else
                                        taskConfig.displayFields.push(field.SObjectField.name);
                                }
                            });
                            if(myTaskComponent.detailSObject && myTaskComponent.ComponentDetails[0].configuration.relativeField){
                                taskConfig.query += ", " + myTaskComponent.ComponentDetails[0].configuration.relativeField.name;
                            }
                            taskConfig.query += " from " + myTaskComponent.SObject.name + (myTaskComponent.ComponentDetails[0].configuration.whereClause ? (" where " + myTaskComponent.ComponentDetails[0].configuration.whereClause) : "");
                            myTaskConfig.push(taskConfig);
                        });

                        DependentPicklist = global.db.DependentPicklistChildValue.findAll({
                            attributes: ['id', 'userType','childfieldvalue'],
                            include: {
                                model: global.db.DependentPicklist,
                                attributes: ['id', 'parentfieldvalue'],
                                include: [{
                                    model: global.db.SObject,
                                    attributes: ['id', 'name', 'label'],
                                },{
                                    model: global.db.SObjectField,
                                    as: 'parentSObjectField',
                                    attributes: ['id', 'name', 'label'],
                                },{
                                    model: global.db.SObjectField,
                                    as : 'childSObjectField',
                                    attributes: ['id', 'name', 'label','picklistValues'],
                                }],
                            },
                            order: [
                                ['DependentPicklistId','ASC'],
                            ]
                        });

                        DependentPicklist.then(function (picklistDetail) {
                            var prvDPID=-1;
                            pickListConfig={};
                            var tempConfig=[];
                            var keyconfig=[];
                            var childDependency=[];
                            var parentValue="";
                            var datasobject;
                            var dataparentfield;
                            var datachildfield;
                            picklistDetail.forEach(function (picklistDetailField) {
                                // console.log("prvDPID",prvDPID)
                                if(prvDPID!==picklistDetailField.DependentPicklist.id){
                                    // console.log("prvDPID11",childDependency)
                                    if(prvDPID!= -1){
                                        key=datasobject + dataparentfield + datachildfield;
                                        if(keyconfig.indexOf(key)===-1){
                                            keyconfig.push(key);    
                                        }
                                        tempConfig.push({
                                            key : key,
                                            sobject : datasobject,
                                            parentfield : dataparentfield,
                                            childfield : datachildfield,
                                            parentValue : parentValue,
                                            childDependency :childDependency
                                        });
                                        parentValue="";
                                        childDependency=[];
                                    }
                                    prvDPID=picklistDetailField.DependentPicklist.id;
                                    datasobject=picklistDetailField.DependentPicklist.SObject.name;
                                    dataparentfield=picklistDetailField.DependentPicklist.parentSObjectField.name;
                                    datachildfield=picklistDetailField.DependentPicklist.childSObjectField.name;
                                    parentValue=picklistDetailField.DependentPicklist.parentfieldvalue;
                                }
                                if(picklistDetailField.userType == "DEFAULT"){
                                    childDependency.push({
                                        values: picklistDetailField.childfieldvalue.split(","),
                                    })
                                }
                                else{
                                    childDependency.push({
                                        values: picklistDetailField.childfieldvalue.split(","),
                                        userType:picklistDetailField.userType
                                    })
                                }
                                
                            });
                            if(prvDPID!= -1){
                                key=datasobject + dataparentfield + datachildfield;
                                if(keyconfig.indexOf(key)===-1){
                                    keyconfig.push(key);    
                                }
                                tempConfig.push({
                                    key : key,
                                    sobject : datasobject,
                                    parentfield : dataparentfield,
                                    childfield : datachildfield,
                                    parentValue : parentValue,
                                    childDependency :childDependency
                                });
                                parentValue="";
                                childDependency=[];
                            }
                            var data;
                            
                            var datadependency=[];
                            
                            keyconfig.forEach(function (key) {
                                datadependency=[];
                                for(var i=tempConfig.length-1;i>=0;i--){
                                    data=tempConfig[i];
                                    if(data.key===key){
                                        datasobject=data.sobject;
                                        dataparentfield =data.parentfield;
                                        datachildfield  =data.childfield;
                                        datadependency.push({
                                            parentValue:data.parentValue,
                                            childDependency:data.childDependency
                                        })
                                        tempConfig.splice(i,1);
                                    }   
                                };
                                if(pickListConfig[datasobject]=== undefined){
                                    pickListConfig[datasobject]=[];
                                }
                                pickListConfig[datasobject].push({
                                    parent:dataparentfield,
                                    child:datachildfield,
                                    dependency:datadependency
                                });
                            });

                            db.SObjectLayout.findAll({
                                attributes: ['id'],
                                include: [{
                                    model: db.SObject,
                                    attributes: ['name'],
                                },{
                                    model: db.MobileEditLayoutConfig,
                                    as:'a',
                                    attributes: ['governingFieldValue'],
                                    include: [{
                                        model: db.SObjectLayoutSection,
                                        attributes: ['id','title','readonly','order'],
                                        required: false,
                                        include: {
                                            model: db.SObjectLayoutField,
                                            attributes: ['readonly','required','order'],
                                            include: {
                                                model: db.SObjectField,
                                                attributes: ['name'],
                                                where: {
                                                    forMobile: true
                                                }
                                            },
                                            order: ['order']
                                        },
                                        where: {
                                            active: true
                                        },
                                        order: ['order']
                                    },{
                                        model: db.SObjectLayoutRelatedList,
                                        attributes: ['id','title','requireAddMore','criteria','readonly'],
                                        required: false,
                                        include: [{
                                            model: db.SObject,
                                            attributes: ['name'],
                                        },{
                                            model: db.SObjectLayoutField,
                                            attributes: ['id','readonly','required','SObjectFieldId','reference','order'],
                                            order: ['order', 'AESC']
                                        },{
                                            model: db.SObjectField,
                                            attributes: ['name'],
                                            required: false,
                                            where:{
                                                forMobile: true
                                            }
                                        }],
                                        where: {
                                            active: true
                                        },
                                        order: ['order']
                                    }],
                                    where: {
                                        active: true
                                    }
                                }
                                ],
                                where: {
                                    type: 'Mobile',
                                    active: true
                                }
                            })
                            .then((mobileEditLayoutConfigs)=>{
                                var uiLayout = {};
                                var relatedListSobjectFieldsDeatilId = [];
                                var fieldNameReferenceMap = {};
                                mobileEditLayoutConfigs.forEach((mobileEditLayoutConfig)=>{
                                    uiLayout[mobileEditLayoutConfig.SObject.name] = [];
                                    var key = mobileEditLayoutConfig.SObject.name;
                                    mobileEditLayoutConfig.a.forEach((configObj)=>{
                                        var governValue = [], sectionsDetails = [];
                                        governField[key].forEach((value)=>{
                                            governValue.push(configObj.governingFieldValue[value]);
                                        });
                                        configObj.SObjectLayoutSections.sort((a, b)=>{
                                            if(a.order < b.order)
                                                return -1;
                                            if(a.order > b.order)
                                                return 1;
                                            return 0;
                                        }).forEach((section)=>{
                                            var sectionConfig = {
                                                title: '',
                                                isLineSection: false,
                                                isEditable: true,
                                                fields: [],
                                                readOnly: [],
                                                mandatory: []
                                            };
                                            sectionConfig.title = section.title;
                                            sectionConfig.isEditable = !section.readonly;
                                            section.SObjectLayoutFields.sort((a, b)=>{
                                                if(a.order < b.order)
                                                    return -1;
                                                if(a.order > b.order)
                                                    return 1;
                                                return 0;
                                            }).forEach((field)=>{
                                                sectionConfig.fields.push(field.SObjectField.name);
                                                if(sectionConfig.isEditable === false){
                                                	sectionConfig.readOnly.push(field.SObjectField.name);
                                                }
                                                else{
                                                	if(field.readonly === true){
                                                		sectionConfig.readOnly.push(field.SObjectField.name);
                                                	}
                                                	if(field.required === true){
                                                		sectionConfig.mandatory.push(field.SObjectField.name);
                                                	}
                                                }
                                            });
                                            sectionsDetails.push(sectionConfig);
                                        });
                                        configObj.SObjectLayoutRelatedLists.forEach((relatedList)=>{
                                            var relatedListConfig = {
                                                title: '',
                                                isLineSection: true,
                                                isEditable: true,
                                                requiredAddMoreFunctionality: false,
                                                object: '',
                                                refrenceField: '',
                                                filterCondition: '',
                                                fields: [],
                                                readOnly: [],
                                                mandatory: []
                                            };
                                            relatedListConfig.title = relatedList.title;
                                            relatedListConfig.requiredAddMoreFunctionality = relatedList.requireAddMore;
                                            relatedListConfig.object = relatedList.SObject.name;
                                            relatedListConfig.refrenceField = relatedList.SObjectField.name;
                                            relatedListConfig.isEditable = !relatedList.readonly;
                                            relatedListConfig.filterCondition = createGroupExpression(relatedList.criteria,"",relatedList.criteria.group.operator);
                                            relatedList.SObjectLayoutFields.sort((a, b)=>{
                                                if(a.order < b.order)
                                                    return -1;
                                                if(a.order > b.order)
                                                    return 1;
                                                return 0;
                                            }).forEach((field)=>{
                                                fieldNameReferenceMap[field.SObjectFieldId] = field.reference;
                                                relatedListSobjectFieldsDeatilId.push(field.SObjectFieldId)
                                                relatedListConfig.fields.push(field.SObjectFieldId);
                                                if(relatedListConfig.isEditable === false){
                                                	relatedListConfig.readOnly.push(field.SObjectFieldId);
                                                }
                                                else{
                                                    if(field.readonly === true){
                                                        relatedListConfig.readOnly.push(field.SObjectFieldId);
                                                    }
                                                    if(field.required === true){
                                                        relatedListConfig.mandatory.push(field.SObjectFieldId);
                                                    }
                                                }
                                            });
                                            sectionsDetails.push(relatedListConfig);
                                        });
                                        uiLayout[key].push({governValue: governValue, sectionsDetails: sectionsDetails})
                                    });
                                });
                                db.SObjectField.findAll({
                                    where: {
                                        forMobile: true,
                                        id: {$in: relatedListSobjectFieldsDeatilId}
                                    }
                                }).then((fields)=>{
                                    Object.keys(uiLayout).forEach(function(key) {
                                        uiLayout[key].forEach((layout)=>{
                                            layout.sectionsDetails.forEach((section)=>{
                                                if(section.isLineSection === true){
                                                    fields.forEach((_field)=>{
                                                        section.fields.forEach((field, index)=>{
                                                            if(_field.id === field){
                                                                if(_field.type === 'reference')
                                                                    section.fields[index] = _field.relationshipName + '.' + fieldNameReferenceMap[_field.id];
                                                                else
                                                                    section.fields[index] = _field.name;
                                                            }
                                                        });
                                                        section.readOnly.forEach((field, index)=>{
                                                            if(_field.id === field){
                                                                if(_field.type === 'reference')
                                                                    section.readOnly[index] = _field.relationshipName + '.' + fieldNameReferenceMap[_field.id];
                                                                else
                                                                    section.readOnly[index] = _field.name;
                                                            }
                                                        });
                                                        section.mandatory.forEach((field, index)=>{
                                                            if(_field.id === field){
                                                                if(_field.type === 'reference')
                                                                    section.mandatory[index] = _field.relationshipName + '.' + fieldNameReferenceMap[_field.id];
                                                                else
                                                                    section.mandatory[index] = _field.name;
                                                            }
                                                        });
                                                    })
                                                }
                                            });
                                        });
                                    });
                                    global.db.MobileOrgDetail.findAll()
                                    .then(function (orgDetail) {
                                        if (orgDetail !== undefined && orgDetail !== null) {
                                            console.log('orgDetail',orgDetail);
                                            if(orgDetail.length>0){
                                                mobileOrgDetail={
                                                    logo : orgDetail[orgDetail.length-1].logo,
                                                    name:orgDetail[orgDetail.length-1].name,
                                                    sysAdminId  : orgDetail[orgDetail.length-1].sysAdminId,
                                                }
                                            }
                                        }
                                        callback && callback({
                                            success: true,
                                            config: {
                                                orgDetail:mobileOrgDetail,
                                                objectMetadata: objectMetadata,
                                                governField: governField,
                                                objectSearchConfig: objectSearchConfig,
                                                userActionConfig: userActionConfig,
                                                myTaskConfig: myTaskConfig,
                                                pickListConfig: pickListConfig,
                                                uiLayout: uiLayout
                                            }
                                        });
                                    })
                                    .catch((err)=>{
                                        callback && callback({
                                            success: false,
                                            message: 'Error occured getting field detail for Mobile Config JSON of org details.',
                                            err: err
                                        });
                                    });
                                })
                                .catch((err)=>{
                                    callback && callback({
                                        success: false,
                                        message: 'Error occured getting field detail for Mobile Config JSON of mobileEditLayoutConfigs.',
                                        err: err
                                    });
                                });
                            })
                            .catch((err)=>{
                                callback && callback({
                                    success: false,
                                    message: 'Error occured getting Mobile Config JSON of mobileEditLayoutConfigs.',
                                    err: err
                                });
                            });

                        }).catch((err)=>{
                            callback && callback({
                                success: false,
                                message: 'Error occured getting Mobile Config JSON of pickListConfig.',
                                err: err
                            });
                        });
                    })
                    .catch((err)=>{
                        callback && callback({
                            success: false,
                            message: 'Error occured getting Mobile Config JSON of myTaskConfig.',
                            err: err
                        });
                    });
                }).catch(function (err) {
                    callback && callback({
                        success: false,
                        message: 'Error occured getting Mobile Config JSON of userActionConfig.',
                        err: err
                    });
                });
                
            }).catch(function (err) {
                callback && callback({
                    success: false,
                    message: 'Error occured getting Mobile Config JSON of objectSearchConfig.',
                    err: err
                });
            });
        }).catch(function (err) {
            callback && callback({
                success: false,
                message: 'Error occured getting Mobile Config JSON of governField.',
                err: err
            });
        });
    }).catch(function (err) {
        callback && callback({
            success: false,
            message: 'Error occured getting Mobile Config JSON of objectMetadata.',
            err: err
        });
    });
}

mobileConfRouter.post('/configJSON', function (req, res) {
    getMobileConfig((response)=>{
        res.json(response);    
    });
});

mobileConfRouter.post('/syncwithmiddleware', (req, res)=>{
    var baseURL = process.env.MOBILE_AUTH_INSTANCE_URL || 'https://esm-mob-auth-v3.herokuapp.com';
    getMobileConfig((response)=>{
        if(response && response.success && response.success === true){
            request({
                url: baseURL + '/api/mobusers/config/',
                method: 'PATCH',
                json: {
                    configuration: response.config,
                     instanceUrl: process.env.INSTANCE_URL.replace(/http:\/\//g,'https:\/\/')
                }
            }, function(error, response, body){
                if(error) {
                    console.log(error);
                    res.json({
                        success: false,
                        message: 'Error occured on server while sending message.\nError: ' + error.message
                    });
                } 
                else{
                    if(response.statusCode === 500){
                       res.json({
                            success: false,
                            message: response.body.errormessage
                        }); 
                    }
                    else{
                        res.json({
                            success: true,
                            message: 'Mobile configurations updated successfully on middleware.',
                        });
                    }
                }
            });
        }
        else{
            res.json(response);
        }
    });
});

module.exports = mobileConfRouter;