var express = require('express');
var useractionRouter = express.Router();

useractionRouter.post('/list', function (req, res) {
    var body = req.body;
    var UserAction = global.db.UserAction.findAll({
        attributes: ['id', 'actionvalue'],
        include: {
            model: global.db.SObject,
            attributes: ['id', 'name', 'label'],
        },
    });

    UserAction.then(function (userActions) {
        if (userActions === undefined || userActions === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading local sobjects.'
            });
        } else {
            return res.json({
                success: true,
                data: {
                    userActions: userActions
                }
            });
        }
    });
});

useractionRouter.post('/save', function (req, res) {
    var userAction = req.body;
    global.db.UserAction.findAll({
        attributes: ['id', 'actionvalue'],
        where: {
            actionvalue: userAction.actionvalue,
            SObjectId: userAction.SObjectId
        },
    }).then(function (userActions) {
        console.log(userActions);
        if (userActions === undefined || userActions === null || userActions.length === 0) {
            // CREATE UserAction
            global.db.UserAction
                .build({
                    actionvalue: userAction.actionvalue,
                    SObjectId: userAction.SObjectId
                })
                .save()
                .then(function (newUserAction) {
                    return res.json({
                        success: true,
                        data: {
                            userAction: newUserAction,
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
                message: 'User Action already configured.'
            });
        }
    });
});

useractionRouter.post('/delete', function (req, res) {
    var userAction = req.body;
    global.db.UserAction.destroy({
        where: {
            id: userAction.id
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

useractionRouter.post('/fields', function (req, res) {
    var userAction = req.body;
    console.log(userAction);
    var UserActionFields = db.UserActionField.findAll({
        include: [{
            model: db.SObjectField,
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        }],
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        },
        where: {
            UserActionId: userAction.id,
        },
    });

    UserActionFields.then(function (userActionFields) {
        if (userActionFields === undefined || userActionFields === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading user action fields.'
            });
        } else {
            return res.json({
                success: true,
                data: {
                    userActionFields: userActionFields
                }
            });
        }
    });
});
useractionRouter.post('/saveuseractionfields', function (req, res) {
    var data = req.body;
    var actionType = "";
    var fieldsToCreate = [];

    data.fieldsToSave.forEach(function (field, index) {
        if (field.readonly === true || field.required === true || field.optional === true) {
            actionType = field.readonly == true ? 'Readonly' : (field.required == true ? 'Required' : 'Optional');
            fieldsToCreate.push({
                UserActionId: data.userAction.id,
                SObjectFieldId: field.SObjectFieldId,
                type: actionType,
            });
        }
    });

    global.db.UserActionField.destroy({
        where: {
            UserActionId: data.userAction.id,
        },
    }).then(function (affectedRows) {
        db.UserActionField.bulkCreate(fieldsToCreate).then(function () {
            return res.json({
                success: true,
            });
        });
    });
});
module.exports = useractionRouter;