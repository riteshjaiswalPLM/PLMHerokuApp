var express = require('express');
var sobjectRouter = express.Router();

sobjectRouter.post('/list', function(req, res){
    var body = req.body;
    var SObjects = undefined;
    
    console.log(body);
    
    if(body.referenceSObjectNames !== undefined && body.referenceSObjectNames !== null){
        SObjects = global.db.SObject.findAll({
            attributes: {
                exclude: ['createdAt','updatedAt']
            },
            include: {
                model: global.db.SObjectField,
                attributes: {
                    exclude: ['createdAt','updatedAt']
                }
            },
            where: {
                name: {
                    $in: body.referenceSObjectNames
                }
            }
        });
    }else if(body.includeFields !== undefined && body.includeFields !== null && body.includeFields === true) {
        SObjects = global.db.SObject.findAll({
            include: {
                model: db.SObjectField,
                attributes: {
                    exclude: ['createdAt','updatedAt']
                }
            },
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        });
    }else{
        SObjects = global.db.SObject.findAll({
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        });
    }
    
    SObjects.then(function(sObjects) {
        if(sObjects === undefined || SObjects === null){
            return res.json({
                success: false,
                message: 'Error occured while loading local sobjects.'
            });
        }else{
            return res.json({
                success: true,
                data: {
                    sObjects: sObjects
                }
            });
        }
    });
});

sobjectRouter.post('/childobjects', function(req, res){
    var sObject = req.body;
    var SObjectFields = db.SObjectField.findAll({
        include: {
            model: db.SObject,
            include: {
                model: db.SObjectField,
                attributes: {
                    exclude: ['createdAt','updatedAt']
                }
            },
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        },
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: {
            type: 'reference',
            referenceTo:{
                $like: '%'+sObject.name+'%'
            }
        }
    });
    SObjectFields.then(function(sObjectFields) {
        if(sObjectFields === undefined || sObjectFields === null){
            return res.json({
                success: false,
                message: 'Error occured while loading child sobjects.'
            });
        }else{
            var uniqueSObjectFields = [];
            var uniqueIds = [];
            sObjectFields.forEach(function(sObjectField){
                if(uniqueIds.indexOf(sObjectField.SObject.id) === -1){
                    uniqueIds.push(sObjectField.SObject.id);
                    uniqueSObjectFields.push(sObjectField);
                }
            });
            return res.json({
                success: true,
                data: {
                    sObjectFields: uniqueSObjectFields
                    // sObjectFields: sObjectFields
                }
            });
        }
    });
});

sobjectRouter.post('/new', function(req, res){
    var sObject = req.body;
    
    global.sfdc.describeSObject(sObject.name,function(err, meta){
        if(err){
             return res.json({
                 success: false,
                 message: 'Error occured while saving new sObject from salesforce.'
             });  
        }else{
            // CREATE SOBJECT
            global.db.SObject
                .build({
                    name: meta.name,
                    label: meta.label,
                    labelPlural: meta.labelPlural,
                    keyPrefix: meta.keyPrefix,
                    custom: meta.custom,
                    customSetting: meta.customSetting,
                    createable: meta.createable,
                    deletable: meta.deletable,
                    layoutable: meta.layoutable,
                    mergeable: meta.mergeable,
                    queryable: meta.queryable,
                    replicateable: meta.replicateable,
                    retrieveable: meta.retrieveable,
                    updateable: meta.updateable
                })
                .save()
                .then(function(newSObject){
                    
                    var sObjectFields = [];
                    meta.fields.forEach(function(field,index,array){
                        sObjectFields.push({
                            name: field.name,
                            label: field.label,
                            custom: field.custom,
                            aggregatable: field.aggregatable,
                            autoNumber: field.autoNumber,
                            byteLength: field.byteLength,
                            calculated: field.calculated,
                            calculatedFormula: field.calculatedFormula,
                            controllerName: field.controllerName,
                            createable: field.createable,
                            defaultValue: field.defaultValue,
                            defaultValueFormula: field.defaultValueFormula,
                            dependentPicklist: field.dependentPicklist,
                            digits: field.digits,
                            encrypted: field.encrypted,
                            externalId: field.externalId,
                            extraTypeInfo: field.extraTypeInfo,
                            filterable: field.filterable,
                            highScaleNumber: field.highScaleNumber,
                            htmlFormatted: field.htmlFormatted,
                            idLookup: field.idLookup,
                            inlineHelpText: field.inlineHelpText,
                            length: field.length,
                            mask: field.mask,
                            maskType: field.maskType,
                            nameField: field.nameField,
                            namePointing: field.namePointing,
                            nillable: field.nillable,
                            picklistValues: field.picklistValues,
                            precision: field.precision,
                            referenceTargetField: field.referenceTargetField,
                            referenceTo: field.referenceTo,
                            relationshipName: field.relationshipName,
                            restrictedDelete: field.restrictedDelete,
                            restrictedPicklist: field.restrictedPicklist,
                            scale: field.scale,
                            sortable: field.sortable,
                            type: field.type,
                            unique: field.unique,
                            updateable: field.updateable,
                            SObjectId: newSObject.id
                        }); 
                    });
                    // CREATE SOBJECT FIELDS
                    global.db.SObjectField
                        .bulkCreate(sObjectFields)
                        .then(function(){
                            // CREATE TAB 
                            db.Tab.create({
                                label: newSObject.labelPlural,
                                created: false,
                                active: false,
                                SObjectId: newSObject.id
                            }).then(function(tab){
                                // CREATE SOBJECT LAYOUTS
                                db.SObjectLayout.bulkCreate([
                                    { type: 'Details',  SObjectId: newSObject.id, created: false, active: false },
                                    { type: 'Create',   SObjectId: newSObject.id, created: false, active: false },
                                    { type: 'Edit',     SObjectId: newSObject.id, created: false, active: false },
                                    { type: 'List',     SObjectId: newSObject.id, created: false, active: false }])
                                .then(function(){
                                    // CREATE DEFAULT LOOKUP FOR NEW SOBJECT
                                    global.db.SObjectLookup
                                        .build({
                                            title: newSObject.labelPlural,
                                            description: 'Default lookup for ' + newSObject.label,
                                            active: true,
                                            default: true,
                                            sobjectname: newSObject.name,
                                            SObjectId: newSObject.id
                                        })
                                        .save()
                                        .then(function(newLookup){
                                            // CREATE DEFAULT LOOKUP FIELDS
                                            var lookup_SObjectFields = db.SObjectField.findAll({
                                                where: {
                                                    SObjectId: newSObject.id,
                                                    $or: [
                                                        { nameField: true },
                                                        { name: 'OwnerId' }
                                                    ]
                                                }
                                            });
                                            lookup_SObjectFields.then(function(_lookup_SObjectFields){
                                                var lookup_SObjectLayoutFields = [];
                                                _lookup_SObjectFields.forEach(function(field,fieldIndex){
                                                    lookup_SObjectLayoutFields.push({
                                                        label: field.label,
                                                        type: 'SObject-Lookup-Field',
                                                        reference: (field.type ==='reference') ? 'Name' : null,
                                                        SObjectFieldId: field.id,
                                                        SObjectLookupId: newLookup.id,
                                                        column: 0,
                                                        order: fieldIndex
                                                    });    
                                                });
                                                global.db.SObjectLayoutField.bulkCreate(lookup_SObjectLayoutFields).then(function(){
                                                    // asyncCallBack();
                                                    // RETURN RESPONSE JSON
                                                    return res.json({
                                                        success: true,
                                                        data: {
                                                            sObject: newSObject,
                                                            sObjectFields: sObjectFields
                                                        }
                                                    });
                                                });
                                            });
                                        });
                                    
                                    // return res.json({
                                    //     success: true,
                                    //     data: {
                                    //         sObject: newSObject,
                                    //         sObjectFields: sObjectFields
                                    //     }
                                    // });
                                });
                            });
                        });
                })
                .catch(function(error){
                    return res.json({
                        success: false,
                        message: 'Error occured while saving new sObject.',
                        error: error
                    }); 
                });
        }
    });
});

sobjectRouter.post('/delete', function(req, res){
    var sObject = req.body;
    global.db.SObject.destroy({
        where: {
            name: sObject.name
        },
        individualHooks: true
    }).then(function(affectedRows){
        return res.json({
            success: true,
            data: {
                sObject: sObject,
                affectedRows: affectedRows
            }
        });
    });
});

sobjectRouter.post('/updateForMobile', function(req, res){
    var sObject = req.body;
    global.db.SObject.update({
            forMobile: sObject.forMobile
        },{
        where: {
            name: sObject.name
        },
        individualHooks: true
    }).then(function(){
        if(sObject.forMobile==false)
        {
            global.db.SObjectField.update({
                forMobile : sObject.forMobile,
                isGovernField : sObject.forMobile
            },{
                where: {
                    SObjectId : sObject.id
                }
            }).then(function(){

                db.SObjectLayout.findOne({
                    attributes: {
                        exclude: ['createdAt','updatedAt']
                    },
                    where: {
                        SObjectId : sObject.id,
                        type : 'Mobile'
                    }
                }).then(function(sObjectLayout) {
                    if(sObjectLayout !== undefined && sObjectLayout !== null ){
                        db.SObjectLayoutSection.destroy({
                            where: {
                                SObjectLayoutId: sObjectLayout.id
                            },
                        }).then(function(deletedSectionsCount){
                            db.SObjectLayoutField.destroy({
                                where: {
                                    SObjectLayoutId: sObjectLayout.id
                                }
                            }).then(function(deletedFieldsCount){
                                global.db.SObjectLayout.destroy({
                                    where: {
                                    id: sObjectLayout.id
                                    }
                                }).then(function(){
                                    global.db.UserAction.destroy({
                                        where: {
                                            SObjectId: sObject.id
                                        }
                                    }).then(function(){
                                        return res.json({
                                            success: true,
                                            message: 'Successfully Update Mobile Sobject detail',
                                        });
                                    })
                                })
                            });
                        });
                    }
                    else{
                        return res.json({
                            success: false,
                            message: 'Error occured while Updating Mobile Sobject detail',
                        }); 
                    }
                }).catch(function(err){
                    console.log(err);
                    return res.json({
                        success: false,
                        message: 'Error occured while Updating Mobile Sobject detail',
                        error:err
                    });
                });
                
            })
            .catch(function(err){
                console.log(err);
                return res.json({
                    success: false,
                    message: 'Error occured while Updating Mobile Sobject detail',
                    error:err
                });
            });
        }
        else{
            db.SObjectLayout.build({ type: 'Mobile',  SObjectId: sObject.id, created: true, active: false })
            .save()
            .then(function(){
                return res.json({
                    success: true,
                    message: 'Successfully Update Mobile Sobject detail',
                }); 
            })
            .catch(function(err){
                console.log(err);
                return res.json({
                    success: false,
                    message: 'Error occured while Updating Mobile Sobject detail',
                    error:err
                });
            });
        }
    })
    .catch(function(err){
        console.log(err);
        return res.json({
            success: false,
            message: 'Error occured while Updating Mobile Sobject detail',
            error:err
        });
    });
});

module.exports = sobjectRouter;