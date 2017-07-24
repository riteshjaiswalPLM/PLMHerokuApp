var express = require('express');
var reportRouter = express.Router();

reportRouter.post('/sObjectList', function (req, res) {
    var SObjects = db.SObject.findAll({
        attributes: {
            exclude: ['createdAt', 'updatedAt']
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

reportRouter.post('/createReport', function (req, res) {
    var listReport = req.body;
    var reportName = listReport.sObjectReportName;
    var reportWhereClause = listReport.sObjectReportWhereClause;
    var fieldsToCreate = [];
    var fieldsToProcess = listReport.searchCriteriaFields.concat(listReport.searchRecordFields);

    //Create Report
    db.SObjectReport.create({
        reportName: reportName,
        whereClause: reportWhereClause,
        created: true,
        active: false,
        SObjectId: listReport.sObjectReport.SObject.id
    }).then(function (report) {
        fieldsToProcess.forEach(function (field, index) {
            fieldsToCreate.push({
                label: (field.label) ? field.label : field.SObjectField.label,
                SObjectFieldId: field.SObjectField.id,
                type: field.type,
                reference: (field.SObjectField.type === 'reference') ? field.reference : null,
                order: field.order,
                SObjectReportId: report.id,
                fromfield: field.fromfield,
                tofield: field.tofield
            });
        });

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
    })
        .catch(function (err) {
            if (err.name === "SequelizeUniqueConstraintError" && err.errors[0].message === "lower(reportName::text) must be unique") {
                return res.json({
                    success: false,
                    message: "Report name must be unique."
                });
            }
            else {
                return res.json({
                    success: false,
                    message: err.message
                });
            }
        });
});

reportRouter.post('/editReport', function (req, res) {
    var listReport = req.body;
    var reportName = listReport.sObjectReportName;
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

    //Update Report
    db.SObjectReport.update({
        reportName: reportName,
        whereClause: reportWhereClause
    }, {
            where: {
                id: listReport.sObjectReportId
            }
        }).then(function () {
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
        })
        .catch(function (err) {
            if (err.name === "SequelizeUniqueConstraintError" && err.errors[0].message === "lower(reportName::text) must be unique") {
                return res.json({
                    success: false,
                    message: "Report name must be unique."
                });
            }
            else {
                return res.json({
                    success: false,
                    message: err.message
                });
            }
        });
});

module.exports = reportRouter;