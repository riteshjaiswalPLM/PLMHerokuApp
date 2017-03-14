var express = require('express');
var sobjectFieldRouter = express.Router();

sobjectFieldRouter.post('/list', function(req, res){
    var sObject = req.body;
    var SObjectFields = db.SObjectField.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: {
            SObjectId: sObject.id
        }
    });
    
    SObjectFields.then(function(sObjectFields) {
        if(sObjectFields === undefined || sObjectFields === null){
            return res.json({
                success: false,
                message: 'Error occured while loading sobject fields.'
            });
        }else{
            var referenceSObjectNames = [];
            sObjectFields.forEach(function(field){
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
                // var _sObjectFields = [];
                // sObjectFields.forEach(function(field){
                //     _field = JSON.parse(JSON.stringify(field));
                //     if(field.type === 'reference'){
                //         _field.reference = _refSObjects[field.referenceTo[0]];
                //     }
                //     _sObjectFields.push(_field);
                // });
                return res.json({
                    success: true,
                    data: {
                        sObjectFields: sObjectFields,
                        refSObjects: _refSObjects                           
                    }
                });
            });
        }
    });
});

sobjectFieldRouter.post('/updateForMobile', function(req, res){
    var sObjectFields = req.body;

    var updateFields;
    if(sObjectFields.forMobile == false){
        updateFields={
            forMobile : sObjectFields.forMobile,
            isGovernField : sObjectFields.forMobile
        };
    }
    else{
        updateFields={
            forMobile : sObjectFields.forMobile,
        };
    }
    global.db.SObjectField.update(updateFields,{
        where: {
            id : sObjectFields.id
        }
    }).then(function(){
            db.SObjectLayout.findOne({
                attributes: {
                    exclude: ['createdAt','updatedAt']
                },
                where: {
                    SObjectId : sObjectFields.SObjectId,
                    type : 'Mobile'
                }
            }).then(function(sObjectLayout) {
                if(sObjectLayout !== undefined && sObjectLayout !== null ){
                    db.SObjectLayoutField.destroy({
                        where: {
                            SObjectLayoutId: sObjectLayout.id,
                            SObjectFieldId :sObjectFields.id
                        }
                    }).then(function(deletedFieldsCount){
                        db.UserActionField.destroy({
                            where: {
                                SObjectFieldId :sObjectFields.id
                            }
                        }).then(function(deletedFieldsCount){
                            return res.json({
                                success: true,
                                message: 'Successfully Update Mobile Sobject fields detail',
                            });
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
                    message: 'Error occured while Updating Mobile Sobject fields detail',
                    error:err
                });
            });
    })
    .catch(function(err){
        console.log(err);
        return res.json({
            success: false,
            message: 'Error occured while Updating Mobile Sobject fields detail',
            error:err
        });
    });
});
sobjectFieldRouter.post('/updateIsGovernField', function(req, res){
    var sObjectFields = req.body;
    global.db.SObjectField.update({
            isGovernField : sObjectFields.isGovernField
        },{
        where: {
            id : sObjectFields.id
        }
    }).then(function(){
        return res.json({
            success: true,
            message: 'Successfully Update Mobile Sobject fields detail',
        });
    })
    .catch(function(err){
        console.log(err);
        return res.json({
            success: false,
            message: 'Error occured while Updating Mobile Sobject fields detail',
            error:err
        });
    });
});

// sobjectFieldRouter.post('/list', function(req, res){
//     var sObject = req.body;
//     var SObjectFields = db.SObjectField.findAll({
//         attributes: {
//             exclude: ['createdAt','updatedAt']
//         },
//         where: {
//             SObjectId: sObject.id
//         }
//     });
    
//     SObjectFields.then(function(sObjectFields) {
//         if(sObjectFields === undefined || sObjectFields === null){
//             return res.json({
//                 success: false,
//                 message: 'Error occured while loading sobject fields.'
//             });
//         }else{
//             return res.json({
//                 success: true,
//                 data: {
//                     sObjectFields: sObjectFields
//                 }
//             });
//         }
//     });
// });

module.exports = sobjectFieldRouter;