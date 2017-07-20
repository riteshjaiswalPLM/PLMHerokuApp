var express = require('express');
var reportRouter = express.Router();

reportRouter.post('/lookuplist', function (req, res) {
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

reportRouter.post('/create', function (req, res) {
    var reportToCreate = req.body;
    if (reportToCreate === null || reportToCreate === undefined) {
        return res.json({
            success: false,
            created: false,
            message: 'No data found for report.'
        });
    } else {
        //Create Report
        db.SObjectReport.create({
            reportName: reportToCreate.reportName,
            created: true,
            active: false,
            SObjectId: reportToCreate.reportsObjectId
        }).then(function (report) {
            var SObjectReport = db.SObjectReport.findAll({
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
                    id: report.id
                }
            });
            SObjectReport.then(function (sObjectReport) {
                if (sObjectReport === undefined || sObjectReport === null) {
                    return res.json({
                        success: false,
                        created: true,
                        message: 'Error occured while fetching report for sObject.'
                    });
                } else {
                    return res.json({
                        success: true,
                        created: true,
                        data: {
                            report: sObjectReport
                        }
                    });
                }
            });
        }).catch(function (err) {
            if (err.name === "SequelizeUniqueConstraintError" && err.errors[0].message === "reportName must be unique") {
                return res.json({
                    success: false,
                    created: false,
                    message: "Report name must be unique."
                });
            }
            else {
                return res.json({
                    success: false,
                    created: false,
                    message: err.message
                });
            }
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

    //Save where clause for the report
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
            if (err.name === "SequelizeUniqueConstraintError" && err.errors[0].message === "reportName must be unique") {
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