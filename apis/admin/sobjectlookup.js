var express = require('express');
var lookupRouter = express.Router();

lookupRouter.post('/list', function(req, res){
    var criteria = (req.body) ? req.body.criteria : undefined;
    var where = (criteria) ? criteria.where : undefined;
    var SObjectLookups = db.SObjectLookup.findAll({
        include: [{
            model: db.SObject,
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        }],
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: (where) ? where : null,
        order: [
            ['id']
        ]
    });
    
    SObjectLookups.then(function(sObjectLookups) {
        if(sObjectLookups === undefined || sObjectLookups === null){
            return res.json({
                success: false,
                message: 'Error occured while loading sObject lookups.'
            });
        }else{
            return res.json({
                success: true,
                data: {
                    sObjectLookups: sObjectLookups
                }
            });
        }
    });
});

lookupRouter.post('/details', function(req, res){
    var lookup = req.body;
    var loadLookupDetails = db.SObjectLookup.findOne({
        include: [{
            model: db.SObject,
            attributes: {
                exclude: ['createdAt','updatedAt']
            },
            include: {
                model: db.SObjectField,
                attributes: {
                    exclude: ['createdAt','updatedAt']
                }
            }
        },{
            model: db.SObjectLayoutField,
            attributes: {
                exclude: ['createdAt','updatedAt']
            },
            include: {
                model: db.SObjectField,
                attributes: {
                    exclude: ['createdAt','updatedAt']
                }
            },
            where: {
                type: 'SObject-Lookup-Field'
            }
        }],
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: {
            id: lookup.id
        }
    });
    
    loadLookupDetails.then(function(sObjectLookup) {
        if(sObjectLookup === undefined || sObjectLookup === null){
            return res.json({
                success: false,
                message: 'Error occured while loading sObject lookup details.'
            });
        }else{
            var referenceSObjectNames = [];
            sObjectLookup.SObject.SObjectFields.forEach(function(field){
                if(field.type === 'reference' && referenceSObjectNames.indexOf(field.referenceTo[0]) === -1){
                    referenceSObjectNames.push(field.referenceTo[0]);
                }
            });
            var referenceSObjects = db.SObject.findAll({
                attributes: {
                    exclude: ['createdAt','updatedAt']
                },
                include: {
                    model: db.SObjectField,
                    attributes: {
                        exclude: ['createdAt','updatedAt']
                    }
                },
                where: {
                    name: {
                        $in: referenceSObjectNames
                    }
                }
            });
            referenceSObjects.then(function(refSObjects){
                var _refSObjects = {};
                refSObjects.forEach(function(refSObject){
                    _refSObjects[refSObject.name] = refSObject;
                });
                return res.json({
                    success: true,
                    data: {
                        sObjectLookup: sObjectLookup,
                        refSObjects: _refSObjects
                    }
                });
            });
            
            // return res.json({
            //     success: true,
            //     data: {
            //         sObjectLookup: sObjectLookup,
            //         refSObjects: _refSObjects
            //     }
            // });
        }
    });
});

lookupRouter.post('/delete', function(req, res){
    var lookup = req.body;
    global.db.SObjectLookup.destroy({
        where: {
            id: lookup.id
        }
    }).then(function(deletedCount){
        if(deletedCount === 0){
            return res.json({
                success: false,
                message: 'Error occured while deleting lookup.'
            });
        }else{
            global.db.SObjectLayoutField.destroy({
                where: {
                    type: 'SObject-Lookup-Field',
                    SObjectLookupId: null
                }
            }).then(function(fieldsDeleted){
                return res.json({
                    success: true,
                    data: {
                        deletedCount: deletedCount
                    }
                });
            });
        }
    });
});

lookupRouter.post('/save', function(req, res){
    var lookupModel = req.body;
    var fieldsToCreate = [];
    console.log(lookupModel);
    
    var createOrUpdateLookup = function(lookup, callback){
        if(lookup.id === undefined || lookup.id === null){
            // CREATE NEW LOOKUP
            global.db.SObjectLookup
                .build({
                    title: lookup.title,
                    description: lookup.description,
                    active: lookup.active,
                    sobjectname: lookup.sobjectname,
                    SObjectId: lookup.SObjectId,
                })
                .save()
                .then(function(newLookup){
                    callback(newLookup);
                });
        }else{
            // UPDATE
            global.db.SObjectLookup
                .update({
                    title: lookup.title,
                    description: lookup.description,
                    active: lookup.active,
                    SObjectId: lookup.SObjectId
                },{
                    where: {
                        id: lookup.id
                    }
                }).then(function(){
                    callback(lookup);
                });
        }
    };
    
    async.each([lookupModel], function(lookupModel, asyncCallBack){
        createOrUpdateLookup(lookupModel, function(lookup){
            global.db.SObjectLayoutField.destroy({
                where: {
                    SObjectLookupId: lookup.id,
                    type: 'SObject-Lookup-Field',
                    SObjectLayoutSectionId: null
                }
            }).then(function(fieldsDeleted){
                lookupModel.SObjectLayoutFields.forEach(function(field, fieldIndex){
                    fieldsToCreate.push({
                        label: field.label,
                        type: 'SObject-Lookup-Field',
                        reference: (field.reference) ? field.reference : null,
                        SObjectFieldId: field.SObjectFieldId,
                        SObjectLookupId: lookup.id,
                        column: 0,
                        order: fieldIndex
                    });    
                });
                global.db.SObjectLayoutField.bulkCreate(fieldsToCreate).then(function(){
                    asyncCallBack();
                });
            });
        });     
    }, function(err){
        if(err){
            return res.json({
                success: false,
                error: err
            });
        }
        
        return res.json({
            success: true,
            data: {
                fieldsUpdated: fieldsToCreate.length
            }
        });
    });
    
});

module.exports = lookupRouter;