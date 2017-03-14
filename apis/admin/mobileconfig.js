var express = require('express');
var mobileConfRouter = express.Router();

mobileConfRouter.post('/configJSON', function (req, res) {
    var SObjectsGovern, SObjectsSearchConfig,UserActionField;
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
            }
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
                    attributes: ['id'],
                    include: {
                        model: global.db.SObjectLayoutField,
                        attributes: ['id', 'type'],
                        include: {
                            model: global.db.SObjectField,
                            attributes: ['name'],
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
                }
            });

            SObjectsSearchConfig.then(function (searchConfig) {
                searchConfig.forEach(function (sObjectsSearchConfigField) {
                    if (sObjectsSearchConfigField.SObjectLayouts[0].SObjectLayoutFields != undefined) {
                        objectSearchConfig[sObjectsSearchConfigField.name] = {};
                        objectSearchConfig[sObjectsSearchConfigField.name].crateria = [];
                        objectSearchConfig[sObjectsSearchConfigField.name].result = [];
                        sObjectsSearchConfigField.SObjectLayouts[0].SObjectLayoutFields.forEach(function (Field) {
                            if (Field.type === "Search-Criteria-Field") {
                                objectSearchConfig[sObjectsSearchConfigField.name].crateria.push(Field.SObjectField.name);
                            }
                            else {
                                objectSearchConfig[sObjectsSearchConfigField.name].result.push(Field.SObjectField.name);
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
                    return res.json({
                        success: true,
                        config: {
                            objectMetadata: objectMetadata,
                            governField: governField,
                            objectSearchConfig: objectSearchConfig,
                            userActionConfig:userActionConfig
                        }
                    });
                }).catch(function (err) {
                    return res.json({
                        success: false,
                        message: 'Error occured getting Mobile Config JSON.',
                        err: err
                    });
                });
                
            }).catch(function (err) {
                return res.json({
                    success: false,
                    message: 'Error occured getting Mobile Config JSON.',
                    err: err
                });
            });
        }).catch(function (err) {
            return res.json({
                success: false,
                message: 'Error occured getting Mobile Config JSON.',
                err: err
            });
        });
    }).catch(function (err) {
        return res.json({
            success: false,
            message: 'Error occured getting Mobile Config JSON.',
            err: err
        });
    });
});

module.exports = mobileConfRouter;