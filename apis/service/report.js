var express = require('express');
var reportRouter = express.Router();
var path = require('path');
var fs = require('fs');
var os = require('os');
var XlsxPopulate = require('xlsx-populate');
var timestamp = require('unix-timestamp');

reportRouter.post('/reporttabs', function (req, res) {
    var Reports = db.SObjectReport.findAll({
        include: [{
            model: db.SObject,
            attributes: {
                exclude: ['labelPlural', 'createdAt', 'updatedAt', 'keyPrefix', 'custom', 'customSetting', 'createable', 'deletable', 'layoutable', 'mergeable', 'queryable', 'replicateable', 'retrieveable', 'updateable', 'forMobile', 'config']
            }
        }],
        attributes: {
            exclude: ['whereClause', 'created', 'active', 'createdAt', 'updatedAt']
        },
        where: {
            created: true,
            active: true
        }
    });
    Reports.then(function (reports) {
        if (reports === undefined || reports === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading report tabs.'
            });
        } else {
            return res.json({
                success: true,
                reporttabs: reports
            });
        }
    });
});

reportRouter.post('/loadReport', function (req, res) {
    var reportid = req.body.reportid;
    var Report = db.SObjectReport.findOne({
        include: [{
            model: db.SObject,
            attributes: {
                exclude: ['labelPlural', 'createdAt', 'updatedAt', 'keyPrefix', 'custom', 'customSetting', 'createable', 'deletable', 'layoutable', 'mergeable', 'queryable', 'replicateable', 'retrieveable', 'updateable', 'forMobile', 'config']
            }
        }],
        attributes: {
            exclude: ['whereClause', 'created', 'active', 'createdAt', 'updatedAt']
        },
        where: {
            id: reportid,
            created: true,
            active: true
        }
    });
    Report.then(function (report) {
        if (report === undefined || report === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading report fields and data.'
            });
        } else {
            var ReportFields = db.SObjectReportField.findAll({
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
                    SObjectReportId: reportid
                }
            });
            ReportFields.then(function (fields) {
                if (fields === undefined || fields === null) {
                    return res.json({
                        success: false,
                        message: 'Error occured while loading report fields and data.'
                    });
                } else {
                    var criteriaFields = [];
                    var resultFields = [];
                    fields.forEach(function (field) {
                        if (field.type == 'Report-Criteria-Field') {
                            criteriaFields.push(field);
                        }
                        else {
                            resultFields.push(field);
                        }
                    });
                    return res.json({
                        success: true,
                        report: report,
                        fields: fields.length,
                        criteriaFields: criteriaFields,
                        resultFields: resultFields
                    });
                }
            });
        }
    });
});

reportRouter.post('/search', function (req, res) {
    var queryObject = req.body;
    var whereString = "";
    var selectFields = ["Id"];
    queryObject.selectFields.forEach(function (field, index, array) {
        if (("," + selectFields + ",").indexOf("," + field.SObjectField.name + ",") === -1) {
            selectFields.push(field.SObjectField.name);
        }
        if (field.SObjectField.type === 'reference') {
            var referenceField = field.SObjectField.relationshipName + '.' + field.reference;
            if (selectFields.indexOf(referenceField) === -1) {
                selectFields.push(referenceField);
            }
        }
    });

    //Set default where condition, if available
    var Report = db.SObjectReport.findOne({
        attributes: {
            exclude: ['created', 'active', 'createdAt', 'updatedAt']
        },
        where: {
            id: queryObject.reportId,
            created: true,
            active: true
        }
    });
    Report.then(function (report) {
        if (report !== undefined && report !== null && report.whereClause !== undefined && report.whereClause !== null && report.whereClause !== "") {
            whereString = report.whereClause + " AND ";
        }

        if (queryObject && queryObject.whereFields && queryObject.whereFields.hasOwnProperty('$and')) {
            queryObject.whereFields['$and'].forEach(function (criteria, index) {
                for (key in criteria) {
                    if (criteria[key].type && (criteria[key].type === 'date' || criteria[key].type === 'datetime')) {
                        var type = criteria[key].type;
                        delete criteria[key].type;
                        for (innerKey in criteria[key]) {
                            if (innerKey === '$gt') {
                                if (type === 'date')
                                    whereString += key + ' >= ' + criteria[key][innerKey] + " AND ";
                                else
                                    whereString += key + ' >= ' + criteria[key][innerKey] + "T00:00:00Z AND ";
                            }
                            else {
                                if (type === 'date')
                                    whereString += key + ' <= ' + criteria[key][innerKey] + " AND ";
                                else
                                    whereString += key + ' <= ' + criteria[key][innerKey] + "T00:00:00Z AND ";
                            }
                        }
                    }
                    else {
                        if (criteria[key].type) {
                            delete criteria[key].type;
                            for (innerKey in criteria[key]) {
                                if (innerKey === '$gt')
                                    whereString += key + ' >= ' + JSON.stringify(criteria[key][innerKey]).replace(/\"/g, "") + " AND ";
                                else
                                    whereString += key + ' <= ' + JSON.stringify(criteria[key][innerKey]).replace(/\"/g, "") + " AND ";
                            }
                        }
                        else {
                            if (criteria[key].fieldtype && criteria[key].fieldtype === "string") {
                                whereString += key + " Like '%" + criteria[key].value + "%' AND ";
                            }
                            else if (criteria[key].fieldtype && (criteria[key].fieldtype === "double" || criteria[key].fieldtype === "currency" || criteria[key].fieldtype === "boolean")) {
                                whereString += key + " = " + criteria[key].value + " AND ";
                            }
                            else if (criteria[key].fieldtype && criteria[key].fieldtype === "picklist") {
                                whereString += key + " in ('" + criteria[key].value + "') AND ";
                            }
                            else if (criteria[key].fieldtype && criteria[key].fieldtype === "date") {
                                whereString += key + " = " + criteria[key].value + " AND ";
                            }
                            else if (criteria[key].fieldtype && criteria[key].fieldtype === "datetime") {
                                whereString += key + " = " + criteria[key].value + "T00:00:00Z AND ";
                            }
                            else {
                                whereString += key + " = '" + criteria[key].value + "' AND ";
                            }
                        }
                    }
                }
            });
            whereString = whereString.substr(0, whereString.length - 4);
        }
        else {
            whereString += queryObject.whereFields;
        }

        global.sfdc
            .sobject(queryObject.sObject.name)
            .select(selectFields.toString())
            .where(whereString)
            .orderby("CreatedDate", "DESC")
            .limit(queryObject.limit + 1)
            .offset(queryObject.limit * (queryObject.page - 1))
            .execute(function (err, records) {
                if (err) {
                    return res.json({
                        success: false,
                        message: 'Error occured while searching records.',
                        error: err
                    });
                }
                else {
                    var hasMore = false;
                    if (records.length > queryObject.limit) {
                        hasMore = true;
                        records.pop();
                    }
                    return res.json({
                        success: true,
                        data: {
                            searchResult: records,
                            currentPage: (records.length === 0) ? 0 : queryObject.page,
                            hasMore: hasMore
                        }
                    });
                }
            });
    }).catch(function (err) {
        return res.json({
            success: false,
            message: 'Error occured while searching records.',
            error: err
        });
    });

});

reportRouter.post('/export', function (req, res) {
    var queryObject = req.body;
    var whereString = "";
    var selectFields = ["Id"];
    queryObject.selectFields.forEach(function (field, index, array) {
        if (("," + selectFields + ",").indexOf("," + field.SObjectField.name + ",") === -1) {
            selectFields.push(field.SObjectField.name);
        }
        if (field.SObjectField.type === 'reference') {
            var referenceField = field.SObjectField.relationshipName + '.' + field.reference;
            if (selectFields.indexOf(referenceField) === -1) {
                selectFields.push(referenceField);
            }
        }
    });

    //Set default where condition, if available
    var Report = db.SObjectReport.findOne({
        attributes: {
            exclude: ['created', 'active', 'createdAt', 'updatedAt']
        },
        where: {
            id: queryObject.reportId,
            created: true,
            active: true
        }
    });
    Report.then(function (report) {
        if (report !== undefined && report !== null && report.whereClause !== undefined && report.whereClause !== null && report.whereClause !== "") {
            whereString = report.whereClause + " AND ";
        }

        if (queryObject && queryObject.whereFields && queryObject.whereFields.hasOwnProperty('$and')) {
            queryObject.whereFields['$and'].forEach(function (criteria, index) {
                for (key in criteria) {
                    if (criteria[key].type && (criteria[key].type === 'date' || criteria[key].type === 'datetime')) {
                        var type = criteria[key].type;
                        delete criteria[key].type;
                        for (innerKey in criteria[key]) {
                            if (innerKey === '$gt') {
                                if (type === 'date')
                                    whereString += key + ' >= ' + criteria[key][innerKey] + " AND ";
                                else
                                    whereString += key + ' >= ' + criteria[key][innerKey] + "T00:00:00Z AND ";
                            }
                            else {
                                if (type === 'date')
                                    whereString += key + ' <= ' + criteria[key][innerKey] + " AND ";
                                else
                                    whereString += key + ' <= ' + criteria[key][innerKey] + "T00:00:00Z AND ";
                            }
                        }
                    }
                    else {
                        if (criteria[key].type) {
                            delete criteria[key].type;
                            for (innerKey in criteria[key]) {
                                if (innerKey === '$gt')
                                    whereString += key + ' >= ' + JSON.stringify(criteria[key][innerKey]).replace(/\"/g, "") + " AND ";
                                else
                                    whereString += key + ' <= ' + JSON.stringify(criteria[key][innerKey]).replace(/\"/g, "") + " AND ";
                            }
                        }
                        else {
                            if (criteria[key].fieldtype && criteria[key].fieldtype === "string") {
                                whereString += key + " Like '%" + criteria[key].value + "%' AND ";
                            }
                            else if (criteria[key].fieldtype && (criteria[key].fieldtype === "double" || criteria[key].fieldtype === "currency" || criteria[key].fieldtype === "boolean")) {
                                whereString += key + " = " + criteria[key].value + " AND ";
                            }
                            else if (criteria[key].fieldtype && criteria[key].fieldtype === "picklist") {
                                whereString += key + " in ('" + criteria[key].value + "') AND ";
                            }
                            else if (criteria[key].fieldtype && criteria[key].fieldtype === "date") {
                                whereString += key + " = " + criteria[key].value + " AND ";
                            }
                            else if (criteria[key].fieldtype && criteria[key].fieldtype === "datetime") {
                                whereString += key + " = " + criteria[key].value + "T00:00:00Z AND ";
                            }
                            else {
                                whereString += key + " = '" + criteria[key].value + "' AND ";
                            }
                        }
                    }
                }
            });
            whereString = whereString.substr(0, whereString.length - 4);
        }
        else {
            whereString += queryObject.whereFields;
        }

        global.sfdc
            .sobject(queryObject.sObject.name)
            .select(selectFields.toString())
            .where(whereString)
            .orderby("CreatedDate", "DESC")
            //.limit(10)
            .execute(function (err, records) {
                if (err) {
                    return res.json({
                        success: false,
                        message: 'Error occured while searching records.',
                        error: err
                    });
                }
                else {
                    records.forEach(function (record, index) {
                        delete record.attributes;
                        delete record.Id;

                        var keys = Object.keys(record);
                        var fieldChanged = false;
                        keys.forEach(function (key) {
                            fieldChanged = false;
                            queryObject.selectFields.forEach(function (field) {
                                if (key == field.SObjectField.name && !fieldChanged) {
                                    if (field.SObjectField.type === 'reference') {
                                        if (record[field.SObjectField.relationshipName] == null) {
                                            record[field.SObjectField.label] = record[field.SObjectField.relationshipName];
                                        } else {
                                            record[field.SObjectField.label] = record[field.SObjectField.relationshipName][field.reference];
                                        }

                                        delete record[key];
                                        delete record[field.SObjectField.relationshipName];
                                        if (keys.indexOf(field.SObjectField.relationshipName) > -1) {
                                            keys.splice(keys.indexOf(field.SObjectField.relationshipName), 1);
                                        }
                                    } else {
                                        if (field.SObjectField.label != key) {
                                            record[field.SObjectField.label] = record[key];
                                            delete record[key];
                                        }
                                    }
                                    fieldChanged = true;
                                }
                            });

                            if (fieldChanged == false) {
                                delete record[key];
                            }
                        });
                    });

                    if (records.length > 0) {
                        var file = "ReportResult" + timestamp.now() + ".xlsx";
                        file = path.join(os.tmpdir(), file);

                        var keys = Object.keys(records[0]);
                        // Load a new blank workbook 
                        XlsxPopulate.fromBlankAsync()
                            .then(workbook => {
                                // Modify the workbook.
                                workbook.sheet("Sheet1").row(1).style("bold", true);
                                keys.forEach(function (key, index) {
                                    workbook.sheet("Sheet1").row(1).cell(index + 1).value(key);
                                    //workbook.sheet("Sheet1").row(1).cell(index + 1).style({ bold: true, italic: true, border: true, borderColor: "0000FF", borderStyle: "thin", fontColor: "0000FF", fill: "909090" });
                                    workbook.sheet("Sheet1").row(1).cell(index + 1).style({ bold: true, border: true, borderColor: "808080", borderStyle: "thin" });
                                    workbook.sheet("Sheet1").column(index + 1).width(key.length > 25 ? key.length : 25);
                                });

                                records.forEach(function (row, index) {
                                    keys.forEach(function (key, _index) {
                                        workbook.sheet("Sheet1").row(index + 2).cell(_index + 1).value(row[key]);
                                        workbook.sheet("Sheet1").row(index + 2).cell(_index + 1).style({ border: true, borderColor: "808080", borderStyle: "thin" });
                                    });
                                });

                                // Write to file.
                                workbook.toFileAsync(file)
                                    .then(workbook => {
                                        return res.json({
                                            success: true,
                                            data: {
                                                file: file
                                            }
                                        });
                                    })
                                    .catch((err) => {
                                        callback && callback({
                                            success: false,
                                            message: 'Error occured while saving Excel file.',
                                            err: err
                                        });
                                    });
                            })
                            .catch((err) => {
                                callback && callback({
                                    success: false,
                                    message: 'Error occured while creating Excel file.',
                                    err: err
                                });
                            });
                    }
                    else {
                        return res.json({
                            success: true
                        });
                    }
                }
            });
    }).catch(function (err) {
        return res.json({
            success: false,
            message: 'Error occured while searching records.',
            error: err
        });
    });

});

reportRouter.post('/getfiledata', function (req, res) {
    fs.createReadStream(req.body.file, { bufferSize: 64 * 1024 }).pipe(res);
});

reportRouter.post('/deletefile', function (req, res) {
    var file = req.body.file;
    fs.unlinkSync(file, (err) => {
        if (err) {
            console.log(err);
        }
    });
});

module.exports = reportRouter;