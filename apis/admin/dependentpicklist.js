var express = require('express');
var dependentpicklistRouter = express.Router();

dependentpicklistRouter.post('/list', function (req, res) {
    var body = req.body;
    var DependentPicklist = global.db.DependentPicklist.findAll({
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
            attributes: ['id', 'name', 'label'],
        }],
       
    });

    DependentPicklist.then(function (picklistDetail) {
        if (picklistDetail === undefined || picklistDetail === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading local sobjects.'
            });
        } else {
            return res.json({
                success: true,
                data: {
                    picklistDetail: picklistDetail
                }
            });
        }
    });
});

dependentpicklistRouter.post('/save', function (req, res) {
    var picklistDetail = req.body;
    global.db.DependentPicklist.findAll({
        attributes: ['id', 'parentfieldvalue'],
        where: {
            parentfieldvalue: picklistDetail.parentfieldvalue,
            SObjectId: picklistDetail.SObjectId,
            parentSObjectFieldId: picklistDetail.parentSObjectFieldId,
            childSObjectFieldId: picklistDetail.childSObjectFieldId
        },
    }).then(function (picklistDetails) {
        console.log(picklistDetails);
        if (picklistDetails === undefined || picklistDetails === null || picklistDetails.length === 0) {
            // CREATE UserAction
            global.db.DependentPicklist
                .build({
                    parentfieldvalue: picklistDetail.parentfieldvalue,
                    SObjectId: picklistDetail.SObjectId,
                    parentSObjectFieldId: picklistDetail.parentSObjectFieldId,
                    childSObjectFieldId: picklistDetail.childSObjectFieldId,
                    userTypeSObjectFieldId: picklistDetail.userTypeSObjectFieldId
                })
                .save()
                .then(function (newPicklistDetail) {
                    return res.json({
                        success: true,
                        data: {
                            picklistDetail: newPicklistDetail,
                        }
                    });
                })
                .catch(function (error) {
                    return res.json({
                        success: false,
                        message: 'Error occured while saving new User action.',
                        error: error
                    });
                });
        } else {
            return res.json({
                success: false,
                message: 'Picklist Detail already configured.'
            });
        }
    });
});

dependentpicklistRouter.post('/delete', function (req, res) {
    var picklistDetail = req.body;
    global.db.DependentPicklist.destroy({
        where: {
            id: picklistDetail.id
        },
    }).then(function (affectedRows) {
        return res.json({
            success: true,
            data: {
                affectedRows: affectedRows
            }
        });
    })
        .catch(function (error) {
            return res.json({
                success: false,
                message: 'Error occured while deleting new User action.',
                error: error
            });
        });
});

dependentpicklistRouter.post('/childfieldvalue', function (req, res) {
    var picklistDetailData = req.body;
    console.log(picklistDetailData);

    var DependentPicklist = global.db.DependentPicklist.findAll({
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
        },{
            model: global.db.SObjectField,
            as : 'userTypeSObjectField',
            attributes: ['id', 'name', 'label','picklistValues'],
        }],
        where: {
            id: picklistDetailData.id
        }
       
    });

    DependentPicklist.then(function (picklistDetail) {
        if (picklistDetail === undefined || picklistDetail === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading local sobjects.'
            });
        } else {
            var DependentPicklistChildVal = global.db.DependentPicklistChildValue.findAll({
                attributes: ['id', 'childfieldvalue','userType'],
                where: {
                    DependentPicklistId: picklistDetailData.id
                },
            
            });

            DependentPicklistChildVal.then(function (dependentPicklistChildDetail) {
                if (dependentPicklistChildDetail === undefined || dependentPicklistChildDetail === null) {
                    return res.json({
                        success: false,
                        message: 'Error occured while loading Picklist Detail.'
                    });
                } else {
                    return res.json({
                        success: true,
                        data: {
                            dependentPicklistDetail: picklistDetail,
                            dependentPicklistChildDetail: dependentPicklistChildDetail
                        }
                    });
                }
            })
        }
    });

    
});
dependentpicklistRouter.post('/savedependentchildvalue', function (req, res) {
    var data = req.body;
    var actionType = "";
    var fieldsToCreate = [];

    data.fieldsToSave.forEach(function (field, index) {
        if (field.childfieldvalue !== undefined && field.childfieldvalue.trim() !== "") {
            
            fieldsToCreate.push({
                DependentPicklistId: data.picklistDetail.id,
                userType: field.userType,
                childfieldvalue: field.childfieldvalue,
            });
        }
    });

    global.db.DependentPicklistChildValue.destroy({
        where: {
            DependentPicklistId: data.picklistDetail.id,
        },
    }).then(function (affectedRows) {
        db.DependentPicklistChildValue.bulkCreate(fieldsToCreate).then(function () {
            return res.json({
                success: true,
            });
        });
    });
});
module.exports = dependentpicklistRouter;