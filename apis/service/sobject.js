var express = require('express');
var sobjectRouter = express.Router();
var path = require('path');
var fs = require('fs');
var dateFormat = require('dateformat');
var jsForce = require('jsforce');
var now = new Date();
var os = require('os');
var XlsxPopulate = require('xlsx-populate');
var timestamp = require('unix-timestamp');

sobjectRouter.post('/search', function (req, res) {

    var queryObject = req.body;
    console.log(queryObject);
    var whereString = "";
    var selectFields = ["Id"];
    queryObject.selectFields.forEach(function (field, index, array) {
        if (("," + selectFields + ",").indexOf("," + field.SObjectField.name + ",") === -1) {
            selectFields.push(field.SObjectField.name);
        }
        if (field.SObjectField.type === 'reference') {
            var referenceField = field.SObjectField.relationshipName + '.' + field.reference;
            console.log(referenceField + ">>>");
            if (selectFields.indexOf(referenceField) === -1) {
                selectFields.push(referenceField);
            }
        }
    });
    console.log(selectFields.toString());

    if (queryObject && queryObject.whereFields && queryObject.whereFields.hasOwnProperty('$and')) {
        queryObject.whereFields['$and'].forEach(function (criteria, index) {
            for (key in criteria) {
                if (criteria[key].type && (criteria[key].type === 'date' || criteria[key].type === 'datetime')) {
                    var type = criteria[key].type;
                    delete criteria[key].type;
                    for (innerKey in criteria[key]) {
                        console.log(criteria[key][innerKey]);
                        if (innerKey === '$gt') {
                            if (type === 'date')
                                whereString += key + ' >= ' + criteria[key][innerKey] + " AND ";
                            else
                                whereString += "DAY_ONLY(" + key + ') >= ' + criteria[key][innerKey] + " AND ";
                        }
                        else {
                            if (type === 'date')
                                whereString += key + ' <= ' + criteria[key][innerKey] + " AND ";
                            else
                                whereString += "DAY_ONLY(" + key + ') <= ' + criteria[key][innerKey] + " AND ";
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
                        else if (criteria[key].fieldtype && (criteria[key].fieldtype === "double" || criteria[key].fieldtype === "currency" || criteria[key].fieldtype === "boolean" || criteria[key].fieldtype === "int")) {
                            whereString += key + " = " + criteria[key].value + " AND ";
                        }
                        else if (criteria[key].fieldtype && criteria[key].fieldtype === "picklist") {
                            whereString += key + " in ('" + criteria[key].value + "') AND ";
                        }
                        else if (criteria[key].fieldtype && criteria[key].fieldtype === "date") {
                            whereString += key + " = " + criteria[key].value + " AND ";
                        }
                        else if (criteria[key].fieldtype && criteria[key].fieldtype === "datetime") {
                            whereString += "DAY_ONLY(" + key + ") = " + criteria[key].value + " AND ";
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
    else if (queryObject.whereFields != undefined && queryObject.whereFields != null && queryObject.whereFields != "") {
        whereString = queryObject.whereFields;
    }
    if (queryObject.whereClauseString != undefined && queryObject.whereClauseString != null && queryObject.whereClauseString != "") {
        if (typeof whereString == 'object') {
            var data = "";
            for (key in whereString) {
                if (data == "") {
                    data += key + " = '" + whereString[key] + "'";
                }
                else {
                    data += " AND " + key + " = '" + whereString[key] + "'";
                }
            }
            whereString = data;

        }
        whereString = whereString == "" ? queryObject.whereClauseString : whereString + " AND " + queryObject.whereClauseString;
    }
    var orderBy = "";
    if (queryObject.orderBy != undefined && queryObject.orderBy != null && queryObject.orderBy != "") {
        orderBy = queryObject.orderBy.replace(/,+/g, ' ');
    }
    else {
        orderBy = "-CreatedDate";
    }
    console.log('WhereString', whereString);
    global.sfdc
        .sobject(queryObject.sObject.name)
        // .select(queryObject.selectFields.toString())
        .select(selectFields.toString())
        .where(whereString)
        // .orderby("CreatedDate", "DESC")
        .sort(orderBy)
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
        });

});
sobjectRouter.post('/export', function (req, res) {
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
                                whereString += "DAY_ONLY(" + key + ') >= ' + criteria[key][innerKey] + " AND ";
                        }
                        else {
                            if (type === 'date')
                                whereString += key + ' <= ' + criteria[key][innerKey] + " AND ";
                            else
                                whereString += "DAY_ONLY(" + key + ') <= ' + criteria[key][innerKey] + " AND ";
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
                        else if (criteria[key].fieldtype && (criteria[key].fieldtype === "double" || criteria[key].fieldtype === "currency" || criteria[key].fieldtype === "boolean" || criteria[key].fieldtype === "int")) {
                            whereString += key + " = " + criteria[key].value + " AND ";
                        }
                        else if (criteria[key].fieldtype && criteria[key].fieldtype === "picklist") {
                            whereString += key + " in ('" + criteria[key].value + "') AND ";
                        }
                        else if (criteria[key].fieldtype && criteria[key].fieldtype === "date") {
                            whereString += key + " = " + criteria[key].value + " AND ";
                        }
                        else if (criteria[key].fieldtype && criteria[key].fieldtype === "datetime") {
                            whereString += "DAY_ONLY(" + key + ") = " + criteria[key].value + " AND ";
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
    else if (queryObject.whereFields != undefined && queryObject.whereFields != null && queryObject.whereFields != "") {
        whereString = queryObject.whereFields;
    }
    if (queryObject.whereClauseString != undefined && queryObject.whereClauseString != null && queryObject.whereClauseString != "") {
        if (typeof whereString == 'object') {
            var data = "";
            for (key in whereString) {
                if (data == "") {
                    data += key + " = '" + whereString[key] + "'";
                }
                else {
                    data += " AND " + key + " = '" + whereString[key] + "'";
                }
            }
            whereString = data;

        }
        whereString = whereString == "" ? queryObject.whereClauseString : whereString + " AND " + queryObject.whereClauseString;
    }
    global.sfdc
        .sobject(queryObject.sObject.name)
        .select(selectFields.toString())
        .where(whereString)
        .orderby("CreatedDate", "DESC")
        //.limit(5)
        .execute(function (err, records) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Error occured while searching records.',
                    error: err
                });
            }

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
                var file = "SearchResult" + timestamp.now() + ".xlsx";
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
        });
});

sobjectRouter.post('/getfiledata', function (req, res) {
    fs.createReadStream(req.body.file, { bufferSize: 64 * 1024 }).pipe(res);
});

sobjectRouter.post('/deletefile', function (req, res) {
    var file = req.body.file;
    fs.unlinkSync(file, (err) => {
        if (err) {
            console.log(err);
        }
    });
});
sobjectRouter.post('/details', function (req, res) {
    console.log("In detail object");
    var queryObject = req.body;
    console.log(queryObject);

    var sObjectDetails = db.SObjectField.findOne({
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        },
        include: {
            model: db.SObject,
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            },
            where: {
                name: queryObject.sObject
            }
        },
        where: {
            name: 'Name'
        }
    });
    sObjectDetails.then(function (sObjectDetail) {
        console.log("sObjectDetail", sObjectDetail)
        if (sObjectDetail != null && sObjectDetail != undefined) {
            if (sObjectFieldListConfig.FieldListMap[queryObject.sObject + '-' + queryObject.type] && sObjectFieldListConfig.FieldListMap[queryObject.sObject + '-' + queryObject.type].indexOf("name") === -1 && sObjectFieldListConfig.FieldListMap[queryObject.sObject + '-' + queryObject.type].indexOf("Name") === -1) {
                sObjectFieldListConfig.FieldListMap[queryObject.sObject + '-' + queryObject.type].push('Name');
            }
        }
        global.sfdc
            .sobject(queryObject.sObject)
            .select(global.sObjectFieldListConfig.FieldListMap[queryObject.sObject + '-' + queryObject.type])
            .where(queryObject.whereFields)
            .execute(function (err, records) {
                if (err) {
                    return res.json({
                        success: false,
                        message: err.toString(),
                        error: err,
                        err: err.toString()
                    });
                } else if (records === undefined || records === null || records.length === 0) {
                    return res.json({
                        success: false,
                        message: 'No such record found!'
                    });
                }
                if (sObjectDetail == null || sObjectDetail == undefined) {
                    records[0].Name = records[0].Id;
                }
                return res.json({
                    success: true,
                    data: {
                        dataModel: records[0]
                    }
                });
            });
    });
});

sobjectRouter.post('/save', function (req, res) {
    var queryObject = req.body;
    var primaryFileName, secondaryFileList = [];

    if (queryObject.operation.toUpperCase() === 'CREATE') {
        var sObject = global.db.SObject.findAll({
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            },
            include: {
                model: global.db.SObjectField,
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                }
            },
            where: {
                name: queryObject.sObject.name
            }
        });
        sObject.then(function (sObjectDetail) {
            if (sObjectDetail != null && sObjectDetail != undefined && sObjectDetail[0] != undefined && sObjectDetail[0].config != null && sObjectDetail[0].config.sobjectconfig != undefined) {
                var configuration = sObjectDetail[0].config.sobjectconfig;
                Object.keys(configuration).forEach((key) => {
                    if (key === "fieldToMap") {
                        Object.keys(configuration[key]).forEach((fieldToMapkey) => {
                            if (queryObject.sObject.data[configuration[key][fieldToMapkey]] !== undefined) {
                                queryObject.sObject.data[fieldToMapkey] = queryObject.sObject.data[configuration[key][fieldToMapkey]];
                            }
                        });
                    }
                    else if (key === "dataToMap") {
                        Object.keys(configuration[key]).forEach((fieldToMapkey) => {
                            if (configuration[key][fieldToMapkey] === "LOGIN_USER_ID") {
                                queryObject.sObject.data[fieldToMapkey] = JSON.parse(JSON.parse(req.cookies.user).userdata).Id;
                            }
                            else if (configuration[key][fieldToMapkey].match(/LOGIN_USER_ID\..+/g)) {
                                try {
                                    queryObject.sObject.data[fieldToMapkey] = JSON.parse(JSON.parse(req.cookies.user).userdata)[configuration[key][fieldToMapkey].substring(14)];
                                }
                                catch (err) {
                                    console.log('err', err)
                                }
                            }
                            else {
                                queryObject.sObject.data[fieldToMapkey] = configuration[key][fieldToMapkey];
                            }
                        });
                    }
                });
            }
            console.log('daa', queryObject.sObject.data)
            if (sObjectDetail != null && sObjectDetail != undefined && sObjectDetail[0] != undefined && sObjectDetail[0].SObjectFields[0] != undefined) {
                // sObjectDetail[0].SObjectFields[0].name
                var sObjectWithTracker = global.db.SObject.findAll({
                    attributes: {
                        exclude: ['createdAt', 'updatedAt']
                    },
                    include: {
                        model: global.db.SObjectField,
                        attributes: {
                            exclude: ['createdAt', 'updatedAt']
                        },
                        where: {
                            referenceTo: {
                                $like: '%akritivtlm__Tracker__c%'
                            }
                        }
                    },
                    where: {
                        name: queryObject.sObject.name
                    }
                });
                sObjectWithTracker.then(function (sObjectWithTrackerDetail) {
                    if (sObjectWithTrackerDetail != null && sObjectWithTrackerDetail != undefined && sObjectWithTrackerDetail[0] != undefined && sObjectWithTrackerDetail[0].SObjectFields[0] != undefined) {
                        var trackerData = {
                            akritivtlm__Input_Source__c: 'Manual - Buyer Portal',
                            akritivtlm__DocArrival_Date__c: dateFormat(now, "isoDateTime"),
                            akritivtlm__Upload_Date__c: dateFormat(now, "isoDateTime")
                        };
                        var trackerSObject = global.db.SObject.findOne({
                            attributes: ['config'],
                            where: {
                                name: 'akritivtlm__Tracker__c'
                            }
                        });
                        trackerSObject.then(function (trackerSObjectDetail) {
                            if (trackerSObjectDetail != null && trackerSObjectDetail != undefined
                                && trackerSObjectDetail.config != null && trackerSObjectDetail.config != undefined
                                && trackerSObjectDetail.config.sobjectconfig != undefined
                                && trackerSObjectDetail.config.sobjectconfig.dataToMap != undefined
                                && trackerSObjectDetail.config.sobjectconfig.dataToMap.akritivtlm__Input_Source__c != undefined) {
                                trackerData.akritivtlm__Input_Source__c = trackerSObjectDetail.config.sobjectconfig.dataToMap.akritivtlm__Input_Source__c;
                            }
                            global.sfdc.sobject('akritivtlm__Tracker__c')
                                .create(trackerData, function (err, ret) {
                                    if (err || !ret.success) {
                                        return res.json({
                                            success: false,
                                            message: 'Error occured while updating record.',
                                            error: err
                                        });
                                    } else {
                                        queryObject.trackerId = ret.id;
                                        queryObject.sObject.data[sObjectWithTrackerDetail[0].SObjectFields[0].name] = ret.id;
                                        return saveSobjectDetail(queryObject, req, res);
                                    }
                                });
                        });
                    }
                    else {
                        return saveSobjectDetail(queryObject, req, res);
                    }
                });
            }
            else {
                return saveSobjectDetail(queryObject, req, res);
            }
            console.log(sObjectDetail);
        });

    } else if (queryObject.operation.toUpperCase() === 'UPDATE') {

        var sObject = global.db.SObject.findAll({
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            },
            where: {
                name: queryObject.sObject.name
            }
        });
        sObject.then(function (sObjectDetail) {

            if (sObjectDetail != null && sObjectDetail != undefined && sObjectDetail[0] != undefined && sObjectDetail[0].config != null && sObjectDetail[0].config.sobjectconfig != undefined) {
                var configuration = sObjectDetail[0].config.sobjectconfig;
                Object.keys(configuration).forEach((key) => {
                    if (key === "fieldToMap") {
                        Object.keys(configuration[key]).forEach((fieldToMapkey) => {
                            if (queryObject.sObject.data[configuration[key][fieldToMapkey]] !== undefined) {
                                queryObject.sObject.data[fieldToMapkey] = queryObject.sObject.data[configuration[key][fieldToMapkey]];
                            }
                        });
                    }
                    else if (key === "dataToMap") {
                        Object.keys(configuration[key]).forEach((fieldToMapkey) => {
                            if (configuration[key][fieldToMapkey] === "LOGIN_USER_ID") {
                                queryObject.sObject.data[fieldToMapkey] = JSON.parse(JSON.parse(req.cookies.user).userdata).Id;
                            }
                            else if (configuration[key][fieldToMapkey].match(/LOGIN_USER_ID\..+/g)) {
                                try {
                                    queryObject.sObject.data[fieldToMapkey] = JSON.parse(JSON.parse(req.cookies.user).userdata)[configuration[key][fieldToMapkey].substring(14)];
                                }
                                catch (err) {
                                    console.log('err', err)
                                }
                            }
                            else {
                                queryObject.sObject.data[fieldToMapkey] = configuration[key][fieldToMapkey];
                            }
                        });
                    }
                });
            }
            console.log('daa', queryObject.sObject.data)
            global.sfdc
                .sobject(queryObject.sObject.name)
                .update(queryObject.sObject.data, function (err, ret) {
                    if (err || !ret.success) {
                        var msg = "Error occured while creating new record.";
                        try {
                            msg = err.toString().substring(err.toString().indexOf(err['name']) + err['name'].length + 1);
                        }
                        catch (err) {
                            console.log('eer', err)
                        }
                        return res.json({
                            success: false,
                            message: msg,
                            error: err,
                            errMsg: err.toString()
                        });
                    } else {
                        return res.json({
                            success: true,
                            data: {
                                id: ret.id
                            }
                        });
                    }
                });
        });
    } else {
        return res.json({
            success: false,
            message: 'Invalid operation !!!'
        });
    }
});

sobjectRouter.post('/multipleApproveSave', function (req, res) {
    var queryObject = req.body;
    var fieldsToUpdate = [];
    var sObject = global.db.SObject.findAll({
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        },
        where: {
            name: queryObject.sObject.name
        }
    });
    sObject.then(function (sObjectDetail) {

        if (sObjectDetail != null && sObjectDetail != undefined && sObjectDetail[0] != undefined && sObjectDetail[0].config != null && sObjectDetail[0].config.sobjectconfig != undefined) {
            var configuration = sObjectDetail[0].config.sobjectconfig;
            Object.keys(configuration).forEach((key) => {
                if (key === "fieldToMap") {
                    Object.keys(configuration[key]).forEach((fieldToMapkey) => {
                        if (queryObject.sObject.data[configuration[key][fieldToMapkey]] !== undefined) {
                            queryObject.sObject.data[fieldToMapkey] = queryObject.sObject.data[configuration[key][fieldToMapkey]];
                        }
                    });
                }
                else if (key === "dataToMap") {
                    Object.keys(configuration[key]).forEach((fieldToMapkey) => {
                        if (configuration[key][fieldToMapkey] === "LOGIN_USER_ID") {
                            queryObject.sObject.data[fieldToMapkey] = JSON.parse(JSON.parse(req.cookies.user).userdata).Id;
                        }
                        else if (configuration[key][fieldToMapkey].match(/LOGIN_USER_ID\..+/g)) {
                            try {
                                queryObject.sObject.data[fieldToMapkey] = JSON.parse(JSON.parse(req.cookies.user).userdata)[configuration[key][fieldToMapkey].substring(14)];
                            }
                            catch (err) {
                                console.log('err', err)
                            }
                        }
                        else {
                            queryObject.sObject.data[fieldToMapkey] = configuration[key][fieldToMapkey];
                        }
                    });
                }
            });
        }
        queryObject.multipleIds.split(",").forEach(function (id) {
            if (id != "") {
                var Modeldata = JSON.parse(JSON.stringify(queryObject.sObject.data));
                Modeldata["Id"] = id;
                fieldsToUpdate.push(Modeldata);
            }
        });
        console.log('daa', queryObject.sObject.data)
        global.sfdc
            .sobject(queryObject.sObject.name)
            .update(fieldsToUpdate, function (err, ret) {
                if (err) {
                    var msg = "Error occured while creating new record.";
                    try {
                        msg = err.toString().substring(err.toString().indexOf(err['name']) + err['name'].length + 1);
                    }
                    catch (err) {
                        console.log('eer', err)
                    }
                    return res.json({
                        success: false,
                        message: msg,
                        error: err,
                        errMsg: err.toString()
                    });
                } else {
                    return res.json({
                        success: true,
                        data: {
                            result: ret
                        }
                    });
                }
            });
    });

});

sobjectRouter.post('/getFieldType', function (req, res) {
    var data = req.body;
    var getAllFieldType = function () {
        var Result = global.db.SObject.findOne({
            attributes: {
                exclude: ['label', 'labelPlural', 'keyPrefix', 'custom', 'customSetting', 'createable', 'deletable', 'layoutable', 'mergeable', 'queryable', 'replicateable', 'retrieveable', 'updateable', 'forMobile', 'config', 'createdAt', 'updatedAt']
            },
            include: {
                model: global.db.SObjectField,
                attributes: {
                    exclude: ['label', 'custom', 'aggregatable', 'autoNumber', 'byteLength', 'calculated', 'calculatedFormula', 'controllerName', 'createable', 'defaultValue', 'defaultValueFormula', 'dependentPicklist', 'digits', 'encrypted', 'externalId', 'extraTypeInfo', 'filterable', 'highScaleNumber', 'htmlFormatted', 'idLookup', 'inlineHelpText', 'length', 'mask', 'maskType', 'nameField', 'namePointing', 'nillable', 'picklistValues', 'precision', 'referenceTargetField', 'referenceTo', 'relationshipName', 'restrictedDelete', 'restrictedPicklist', 'scale', 'sortable', 'unique', 'updateable', 'forMobile', 'isGovernField', 'SObjectId', 'createdAt', 'updatedAt']
                },
                where: {
                    name: {
                        $in: data.fieldname
                    }
                }
            },
            where: {
                name: data.sobjectname
            }
        });
        Result.then(function (result) {
            if (result != null && result != undefined && result.SObjectFields[0] != undefined) {
                var fieldTypes = {};
                result.SObjectFields.forEach(function (field) {
                    fieldTypes[field.name] = field.type;
                });
                return res.json({
                    success: true,
                    fieldDataTypes: fieldTypes
                });
            }
            else {
                return res.json({
                    success: false
                });
            }
        });
    }
    if (data.sobjectname == undefined || data.sobjectname == '') {
        global.sfdc.getUserMapping(null, function (err, UserMapping) {
            if (err) {
                return res.json({ success: false, message: err.message });
            } else {
                global.UserMapping = UserMapping;
                data.sobjectname = global.UserMapping.SObject.name;
                getAllFieldType();
            }
        });
    }
    else {
        getAllFieldType();
    }
});
sobjectRouter.post('/approveRequest', function (req, res) {
    console.log(global.sfdc.username);

    var Request = require("request");
    console.log(Request);
    Request.post({
        "headers": {
            "content-type": "application/json; charset=utf-8",
            "Authorization": "Bearer " + global.sfdc.accessToken
        },
        "url": global.sfdc.instanceUrl+"/services/apexrest/Cases/ApprovalService/",
        "body": JSON.stringify({
            "approvalDetailId": req.body.id,
            "action": req.body.action,
            "comment": req.body.comment
        })
    }, (error, response, body) => {
        if (error) {
            return console.log(error);
        }
        if (response.statusCode == 200) {
            return res.json({
                success: true,
                namespace : global.sfdc.Namespace
            });
        }
    });
});
var uploadFileOnSalesforce = function (queryObject) {
    var attachmentIdArray = [];
    if (queryObject.files && queryObject.files.length > 0) {
        var fileUploadedSuccess = true;
        queryObject.files.forEach(function (fileToBeSaved) {
            fs.readFile(path.join(os.tmpdir(), fileToBeSaved.fileName), function (err, fileData) {
                if (err) {
                    console.error(err);
                    deleteAttachment(attachmentIdArray);
                    fileUploadedSuccess = false;
                    return;
                }
                /*else{
                    console.log('File Attachment');
                    var fileObj = { 
                        ParentId: queryObject.sObject.data.Id,
                        Name : fileToBeSaved.originalFileName,
                        Body: new Buffer(fileData).toString('base64'),
                        ContentType : fileToBeSaved.fileType,
                        Description : queryObject.currentUserId                        
                    };
                    global.sfdc.sobject('ContentVersion').create(fileObj, function(err, ret){
                        if(err || !ret.success){
                            deleteAttachment(attachmentIdArray);
                            fileUploadedSuccess = false;
                            return;
                        }
                        else{
                            
                            attachmentIdArray.push(ret.id);                            
                            fileUploadedSuccess = true;
                            return;
                            
                        }
                    });
                }*/

                var cvObj = {
                    PathOnClient: fileToBeSaved.originalFileName,
                    Title: fileToBeSaved.originalFileName,
                    VersionData: new Buffer(fileData).toString('base64')
                    //Description: JSON.parse(JSON.parse(req.cookies.user).userdata).Id

                };
                global.sfdc.sobject('ContentVersion').create(cvObj, function (cverr, ret) {
                    var cvIdArray = [];

                    if (cverr || !ret.success) {
                        cvIdArray.push(ret.id);
                        deleteContentVersion(cvIdArray, cdlIdArray);
                        /*return res.json({
                            success: false,
                            message: 'Error occured while saving Attachment attachments.'
                        });*/
                        fileUploadedSuccess = false;
                    }
                    else {
                        //var cvIdArray =[];
                        cvIdArray.push(ret.id);
                        global.sfdc.sobject('ContentVersion')
                            .select('ContentDocumentId')
                            .where({ Id: ret.id })
                            .execute(function (err, cvrecord) {
                                if (err) {
                                    deleteContentVersion(cvIdArray, cdlIdArray);
                                    /*return res.json({
                                        success: false,
                                        message: 'Error occured while saving Attachment attachments.'
                                    });*/
                                    fileUploadedSuccess = false;
                                }

                                var cdlObj = {
                                    LinkedEntityId: queryObject.sObject.data.Id,
                                    ContentDocumentId: cvrecord[0].ContentDocumentId,
                                    ShareType: 'V',
                                    Visibility: 'AllUsers'
                                };
                                global.sfdc.sobject('ContentDocumentLink').create(cdlObj, function (cdlerr, cdlret) {
                                    if (cdlerr || !cdlret.success) {
                                        deleteContentVersion(cvIdArray, cdlIdArray);
                                        /*return res.json({
                                            success: false,
                                            message: 'Error occured while saving Attachment attachments.'
                                        });*/
                                        fileUploadedSuccess = false;
                                    }
                                    else {
                                        var cdlIdArray = [];
                                        cdlIdArray.push(cdlret.id);
                                        if (cvIdArray.length === queryObject.files.length && cdlIdArray.length === queryObject.files.length) {
                                            /* return res.json({
                                                 success: true
                                             });*/
                                            fileUploadedSuccess = true;
                                        }


                                    }
                                });
                            });
                    }
                });

            });
        });

        return fileUploadedSuccess;
    }
    return true;
}

var deleteAttachment = function (attachmentIdArray) {
    attachmentIdArray.forEach(function (attachmentId) {
        global.sfdc.sobject('Attachment').destroy(attachmentId);
    });
};

var updateTracker = function (file, callback) {

    var trackerData = {
        Id: file.trackerId,
        akritivtlm__Primary_Document_ID__c: file.Id,
        akritivtlm__Primary_Document_Name__c: file.originalFileName
    };
    global.sfdc.sobject('akritivtlm__Tracker__c')
        .update(trackerData, function (err, ret) {
            if (err && !ret.success) {
                callback(false);
            } else {
                callback(true);
            }
        });
};

var deleteFilesFromHerokuAfterUpload = function (files) {
    if (files) {
        files.forEach(function (file) {
            fs.unlink(path.join(os.tmpdir(), file.fileName));
        })
    }
};

var saveSobjectDetail = function (queryObject, req, res) {
    global.sfdc
        .sobject(queryObject.sObject.name)
        .create(queryObject.sObject.data, function (err, ret) {
            if (err || !ret.success) {
                if (queryObject.trackerId != undefined && queryObject.trackerId != null) {
                    global.sfdc.sobject('akritivtlm__Tracker__c').destroy(queryObject.trackerId);
                }
                var msg = "Error occured while creating new record.";
                try {
                    msg = err.toString().substring(err.toString().indexOf(err['name']) + err['name'].length + 1);
                }
                catch (err) {
                    console.log('eer', err)
                }
                return res.json({
                    success: false,
                    message: msg,
                    error: err,
                    errMsg: err.toString()
                });
            } else {
                var sObjectDetails = db.SObjectField.findOne({
                    attributes: {
                        exclude: ['createdAt', 'updatedAt']
                    },
                    include: {
                        model: db.SObject,
                        attributes: {
                            exclude: ['createdAt', 'updatedAt']
                        },
                        where: {
                            name: queryObject.sObject.name
                        }
                    },
                    where: {
                        name: 'Name'
                    }
                });
                sObjectDetails.then(function (sObjectDetail) {
                    console.log("sObjectDetail", sObjectDetail);
                    var selectField = 'Id';
                    if (sObjectDetail != null && sObjectDetail != undefined) {
                        selectField = 'Name';
                    }

                    global.sfdc
                        .sobject(queryObject.sObject.name)
                        .select(selectField)
                        .where({ id: ret.id })
                        .execute(function (err, records) {
                            if (err || records.length == 0) {
                                return res.json({
                                    success: false,
                                    message: 'Error occured while creating new records.',
                                    error: err
                                });
                            }
                            if (queryObject.trackerId != undefined && queryObject.trackerId != null) {
                                queryObject.sObject.data.Id = ret.id;
                                queryObject.currentUserId = JSON.parse(JSON.parse(req.cookies.user).userdata).Id;

                                console.log("File upload sucess");
                                console.log(isUploadFileSuccess);

                                if (!isUploadFileSuccess) {
                                    global.sfdc.sobject('akritivtlm__Tracker__c').destroy(queryObject.trackerId);
                                    global.sfdc.sobject(queryObject.sObject.name).destroy(queryObject.sObject.data.Id);
                                    return res.json({
                                        success: false,
                                        message: 'Error occured while creating new record.',
                                        error: err
                                    });
                                }
                                else {
                                    deleteFilesFromHerokuAfterUpload(queryObject.files);
                                    return res.json({
                                        success: true,
                                        data: {
                                            id: ret.id,
                                            message: records[0][selectField] + ' has been created successfully!'
                                        }
                                    });
                                }
                            }
                            else {
                                queryObject.sObject.data.Id = ret.id;
                                var isUploadFileSuccess = uploadFileOnSalesforce(queryObject);

                                if (isUploadFileSuccess) {
                                    console.log("File upload sucess");
                                }
                                deleteFilesFromHerokuAfterUpload(queryObject.files);
                                return res.json({
                                    success: true,
                                    data: {
                                        id: ret.id,
                                        message: records[0][selectField] + ' has been created successfully!'
                                    }
                                });
                            }

                        });
                });

            }
        });
};

module.exports = sobjectRouter;
