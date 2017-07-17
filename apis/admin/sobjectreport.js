var express = require('express');
var reportRouter = express.Router();

reportRouter.post('/lookuplist', function (req, res) {
    var SObjects = db.SObject.findAll({
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        },
        where: {
            id: {
                $notIn: db.sequelize.literal(
                    '( SELECT "SObjectId" FROM "SObjectReports" )'
                )
            }
        },
        order: [
            ['label']
        ]
    });
    SObjects.then(function (sObjects) {
        if (sObjects === undefined || sObjects === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading reports for sObject.'
            });
        } else {
            return res.json({
                success: true,
                data: {
                    reportsObjectsList: sObjects
                }
            });
        }
    });
});

reportRouter.post('/list', function (req, res) {
    var SObjectReports = db.SObjectReport.findAll({
        include: [{
            model: db.SObject,
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        }],
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        },
        where: {
            created: true
        },
        order: [
            ['id']
        ]
    });
    SObjectReports.then(function (sObjectReports) {
        if (sObjectReports === undefined || sObjectReports === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading reports for sObject.'
            });
        } else {
            return res.json({
                success: true,
                data: {
                    reports: sObjectReports
                }
            });
        }
    });
});

reportRouter.post('/create', function (req, res) {
    var reportToCreate = req.body;
    if (reportToCreate === null || reportToCreate === undefined) {
        return res.json({
            success: false,
            message: 'No data found for report.'
        });
    } else {
        //Create Report
        db.SObjectReport.create({
            created: true,
            active: false,
            SObjectId: reportToCreate.id
        }).then(function () {
            return res.json({
                success: true
            });
        });
    }
});

reportRouter.post('/changeactive', function (req, res) {
    var sObjectReport = req.body;
    db.SObjectReport.update({
        active: sObjectReport.active
    }, {
            where: {
                id: sObjectReport.id
            }
        }).then(function () {
            return res.json({
                success: true
            });
        });
});

reportRouter.post('/delete', function (req, res) {
    var sObjectReport = req.body;
    db.SObjectReport.destroy({
        where: {
            id: sObjectReport.id
        }
    }).then(function () {
        return res.json({
            success: true
        });
    });
});

reportRouter.post('/fields', function (req, res) {
    var report = req.body;
    var SObjectReportFields = db.SObjectReportField.findAll({
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
            SObjectReportId: report.id
        },
        order: [
            ['order']
        ]
    });

    SObjectReportFields.then(function (sObjectReportFields) {
        if (sObjectReportFields === undefined || sObjectReportFields === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading report fields.'
            });
        } else {
            return res.json({
                success: true,
                data: {
                    sObjectReportFields: sObjectReportFields
                }
            });
        }
    });
});

reportRouter.post('/saveReport', function (req, res) {
    var listReport = req.body;
    var reportWhereClause = listReport.sObjectReportWhereClause;
    var fieldsToCreate = [];
    var fieldsToProcess = listReport.searchCriteriaFields.concat(listReport.searchRecordFields);

    fieldsToProcess.forEach(function (field, index) {
        fieldsToCreate.push({
            label: (field.label) ? field.label : field.SObjectField.label,
            SObjectFieldId: field.SObjectField.id,
            type: field.type,
            reference: (field.SObjectField.type === 'reference') ? field.reference : null,
            order: field.order,
            SObjectReportId: field.SObjectReportId,
            fromfield: field.fromfield,
            tofield: field.tofield
        });
    });

    //Save where clause for the report
    db.SObjectReport.update({
        whereClause: reportWhereClause
    }, {
            where: {
                id: listReport.sObjectReportId
            }
        });

    //Delete existing report fields for this report
    db.SObjectReportField.destroy({ where: { SObjectReportId: listReport.sObjectReportId } });

    if (fieldsToCreate.length > 0) {
        db.SObjectReportField.bulkCreate(fieldsToCreate).then(function () {
            return res.json({
                success: true
            });
        });
    }
    else {
        return res.json({
            success: true
        });
    }
});

module.exports = reportRouter;