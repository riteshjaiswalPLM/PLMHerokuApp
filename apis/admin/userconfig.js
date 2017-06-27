var express = require('express');
var userconfigRouter = express.Router();
var validator = require('validator');
var moment = require('moment');
var request = require('request');
var os = require('os');
var timestamp = require('unix-timestamp');
var path = require('path');
var fs = require('fs');
var json2csv = require('json2csv');
var batch = require('batchflow');

userconfigRouter.post('/getuserfields', function (req, res) {
    global.sfdc
        .getUserMapping(null, function (err, UserMapping) {
            console.info('getUserMapping...........');
            if (err) {
                return res.json({ success: false, message: err.message });
            } else {
                global.UserMapping = UserMapping;
                var usersObjectFields = db.SObjectField.findAll({
                    attributes: {
                        exclude: ['createdAt', 'updatedAt']
                    },
                    where: {
                        SObjectId: global.UserMapping.UsernameField.SObjectId,
                        createable: true,
                        updateable: true
                    },
                    order: [
                        ['label']
                    ]
                });

                usersObjectFields.then(function (sObjectFields) {
                    if (sObjectFields === undefined || sObjectFields === null) {
                        return res.json({
                            success: false,
                            message: 'Error occured while loading sobject fields.'
                        });
                    } else {
                        var referenceSObjectNames = [];
                        sObjectFields.forEach(function (field, ind) {
                            if (field.type === 'reference' && referenceSObjectNames.indexOf(field.referenceTo[0]) === -1) {
                                referenceSObjectNames.push(field.referenceTo[0]);
                            }
                        });

                        var referenceSObjects = db.SObject.findAll({
                            attributes: {
                                exclude: ['createdAt', 'updatedAt']
                            },
                            include: {
                                model: db.SObjectField,
                                attributes: {
                                    exclude: ['createdAt', 'updatedAt']
                                }
                            },
                            where: {
                                name: {
                                    $in: referenceSObjectNames
                                }
                            }
                        });
                        referenceSObjects.then(function (refSObjects) {
                            var _refSObjects = {};
                            refSObjects.forEach(function (refSObject) {
                                _refSObjects[refSObject.name] = refSObject;
                            });
                            return res.json({
                                success: true,
                                data: {
                                    usersObjectFields: sObjectFields,
                                    refSObjects: _refSObjects
                                }
                            });
                        });
                    }
                });
            }
        });
});

userconfigRouter.post('/getmappedfields', function (req, res) {

    var mappedFields = db.UsersUploadConfig.findAll({
        attributes: {
            exclude: ['id', 'required', 'createdAt', 'updatedAt']
        }
    });

    mappedFields.then(function (fields) {
        if (fields === undefined || fields === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading existing mapped fields.'
            });
        } else {
            return res.json({
                success: true,
                data: {
                    mappedFields: fields
                }
            });
        }
    });
});

userconfigRouter.post('/saveuserconfig', function (req, res) {
    var fieldsmappings = req.body;
    var recordsToInsert = [];

    fieldsmappings.forEach(function (fieldsmapping) {
        if (fieldsmapping.type == 'datetime' || fieldsmapping.type == 'date') {
            recordsToInsert.push({
                sfFieldName: fieldsmapping.name,
                label: fieldsmapping.label,
                //fileFieldName: (fieldsmapping.fileFieldName) ? fieldsmapping.fileFieldName : fieldsmapping.name,
                fileFieldName: fieldsmapping.fileFieldName,
                datatype: fieldsmapping.type,
                datatypeFormat: fieldsmapping.csvFieldFormat,
                required: !fieldsmapping.nillable,
                isUsernameField: fieldsmapping.isUsernameField
            });
        }
        else if (fieldsmapping.type == 'reference') {
            recordsToInsert.push({
                sfFieldName: fieldsmapping.name,
                label: fieldsmapping.label,
                //fileFieldName: (fieldsmapping.fileFieldName) ? fieldsmapping.fileFieldName : fieldsmapping.name,
                fileFieldName: fieldsmapping.fileFieldName,
                datatype: fieldsmapping.type,
                required: !fieldsmapping.nillable,
                isUsernameField: fieldsmapping.isUsernameField,
                referenceTableName: fieldsmapping.relationshipName,
                referenceFieldName: fieldsmapping.reference
            });
        }
        else {
            recordsToInsert.push({
                sfFieldName: fieldsmapping.name,
                label: fieldsmapping.label,
                //fileFieldName: (fieldsmapping.fileFieldName) ? fieldsmapping.fileFieldName : fieldsmapping.name,
                fileFieldName: fieldsmapping.fileFieldName,
                datatype: fieldsmapping.type,
                required: !fieldsmapping.nillable,
                isUsernameField: fieldsmapping.isUsernameField
            });
        }
    });

    //Delete existing mapping
    db.UsersUploadConfig.destroy({ where: {} });

    db.UsersUploadConfig.bulkCreate(recordsToInsert)
        .then(function () {
            return res.json({
                success: true
            });
        });
});

userconfigRouter.post('/getUploadHistory', function (req, res) {

    var historyRecords = db.UsersUploadHistory.findAll({
        attributes: {
            exclude: ['updatedAt']
        },
        order: [
            ['createdAt', 'DESC']
        ]
    });

    historyRecords.then(function (records) {
        if (records === undefined || records === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading upload history.'
            });
        } else {
            return res.json({
                success: true,
                data: {
                    historyRecords: records
                }
            });
        }
    });
});

userconfigRouter.post('/uploadUsers', function (req, res) {
    global.sfdc
        .getUserMapping(null, function (err, UserMapping) {
            console.info('getUserMapping...........');
            if (err) {
                return res.json({
                    success: false,
                    message: err.message
                });
            } else {

                global.UserMapping = UserMapping;
                var fileName = req.body.filename;
                var records = req.body.userFile;
                var username = req.body.username;

                var sfdcRecords = [];
                var sfdcRecord = {};

                var userFieldConfigs = db.UsersUploadConfig.findAll({
                    attributes: {
                        exclude: ['createdAt', 'updatedAt']
                    }
                });

                var usernamefield = "";
                var referenceFields = [];

                userFieldConfigs.then(function (userFieldConfigData) {
                    var userFieldConfig = JSON.parse(JSON.stringify(userFieldConfigData));

                    userFieldConfig.forEach(function (config, index) {
                        if (config.isUsernameField) {
                            usernamefield = config.sfFieldName;
                        }

                        //Get all the reference fields details
                        if (config.datatype == "reference") {
                            referenceFields.push({
                                table: config.referenceTableName,
                                field: config.referenceFieldName
                            });
                        }

                        if (index + 1 == userFieldConfig.length) {
                            getAllRefData();
                        }
                    });
                });

                var allRefData = [];
                var hitCount = 0;
                var getAllRefData = function () {
                    if (referenceFields.length > 0) {

                        referenceFields.forEach(function (refField, _ind) {

                            global.sfdc.sobject(global.UserMapping.SObject.name)
                                .select(['Id', refField.table + ".Id", refField.table + "." + refField.field])
                                .where({
                                    [refField.table + "." + refField.field]: {
                                        $ne: null
                                    }
                                })
                                .execute(function (err, data) {

                                    if (err) {
                                        //Adding black data for the given table-field
                                        allRefData.push({
                                            table: refField.table,
                                            data: {}
                                        });

                                        hitCount = hitCount + 1;
                                        if (hitCount == referenceFields.length) {
                                            validate();
                                        }
                                    }
                                    else {
                                        mergeAllRefData(allRefData, data, refField.table, refField.field);
                                        hitCount = hitCount + 1;
                                        if (hitCount == referenceFields.length) {
                                            validate();
                                        }
                                    }
                                })
                        });
                    }
                    else {
                        validate();
                    }
                };

                var mergeAllRefData = function (allRefData, data, tableName, fieldName) {
                    var refDataJson = {};
                    refDataJson.table = tableName;
                    refDataJson.data = {};
                    data.forEach(function (_data) {
                        if (_data[tableName] != null && _data[tableName] != undefined) {
                            refDataJson['data'][_data[tableName][fieldName]] = _data[tableName]['Id'];
                        }
                    });
                    allRefData.push(refDataJson);
                };

                var validate = function () {
                    userFieldConfigs.then(function (userFieldConfigData) {
                        var userFieldConfig = JSON.parse(JSON.stringify(userFieldConfigData));
                        records.forEach(function (record, index) {
                            var keys = Object.keys(record);
                            sfdcRecord = {};
                            sfdcRecord.valid = true;
                            sfdcRecord.invalidReason = "";
                            sfdcRecord.index = index;

                            //Validations
                            userFieldConfig.forEach(function (config) {
                                matchflag = false;
                                keys.forEach(function (key) {
                                    if (key == config.fileFieldName) {
                                        matchflag = true;

                                        sfdcRecord[config.sfFieldName] = record[key];

                                        if (validator.isNull(record[key])) {
                                            if (config.required) {
                                                sfdcRecord.valid = false;
                                                sfdcRecord.invalidReason = sfdcRecord.invalidReason + " " + key + " cannot be null/blank.";
                                            }
                                        }
                                        else {
                                            if (config.datatype == "int") {
                                                if (!validator.isInt(record[key])) {
                                                    sfdcRecord.valid = false;
                                                    sfdcRecord.invalidReason = sfdcRecord.invalidReason + " Invalid value provided for " + key + ". Expected value type '" + config.datatype + "'.";
                                                }
                                            }
                                            else if (config.datatype == "double") {
                                                if (!validator.isDecimal(record[key])) {
                                                    sfdcRecord.valid = false;
                                                    sfdcRecord.invalidReason = sfdcRecord.invalidReason + " Invalid value provided for " + key + ". Expected value type '" + config.datatype + "'.";
                                                }
                                            }
                                            else if (config.datatype == "boolean") {
                                                if (!validator.isBoolean(record[key])) {
                                                    sfdcRecord.valid = false;
                                                    sfdcRecord.invalidReason = sfdcRecord.invalidReason + " Invalid value provided for " + key + ". Expected value type '" + config.datatype + "'.";
                                                }
                                            }
                                            else if (config.datatype == "email") {
                                                if (!validator.isEmail(record[key])) {
                                                    sfdcRecord.valid = false;
                                                    sfdcRecord.invalidReason = sfdcRecord.invalidReason + " Invalid value provided for " + key + ". Expected value type '" + config.datatype + "'.";
                                                }
                                            }
                                            // else if (config.datatype == "string" || config.datatype == "textarea") {
                                            //     if (!validator.isAlphanumeric(record[key])) {
                                            //         sfdcRecord.valid = false;
                                            //         sfdcRecord.invalidReason = sfdcRecord.invalidReason + " Invalid value provided for " + key + ". Expected value type '" + config.datatype + "'.";
                                            //     }
                                            // }
                                            else if (config.datatype == "url") {
                                                if (!validator.isURL(record[key])) {
                                                    sfdcRecord.valid = false;
                                                    sfdcRecord.invalidReason = sfdcRecord.invalidReason + " Invalid value provided for " + key + ". Expected value type '" + config.datatype + "'.";
                                                }
                                            }
                                            else if (config.datatype == "datetime" || config.datatype == "date") {
                                                if (!moment(record[key], config.datatypeFormat).isValid()) {
                                                    sfdcRecord.valid = false;
                                                    sfdcRecord.invalidReason = sfdcRecord.invalidReason + " Invalid value/format provided for " + key + ". Expected value type '" + config.datatype + "' (" + config.datatypeFormat + ").";
                                                }

                                                if (sfdcRecord.valid) {
                                                    sfdcRecord[config.sfFieldName] = moment(record[key], config.datatypeFormat).format();
                                                }
                                            }
                                            else if (config.datatype == "phone") {
                                                var phoneno = "\\D*?(\\d\\D*?){10}";
                                                if (record[key].length < 10 || !(record[key].match(phoneno))) {
                                                    sfdcRecord.valid = false;
                                                    sfdcRecord.invalidReason = sfdcRecord.invalidReason + " Invalid value provided for " + key + ". Expected value type '" + config.datatype + "'.";
                                                }
                                            }
                                            else if (config.datatype == "reference") {
                                                var isRefvalid = false;
                                                allRefData.forEach(function (refData) {
                                                    if (refData.table == config.referenceTableName) {
                                                        if (refData.data[record[key]] != null && refData.data[record[key]] != undefined) {
                                                            isRefvalid = true;
                                                            sfdcRecord[config.sfFieldName] = refData.data[record[key]];
                                                        }
                                                    }
                                                });
                                                if (!isRefvalid) {
                                                    sfdcRecord.valid = false;
                                                    sfdcRecord.invalidReason = sfdcRecord.invalidReason + " Invalid reference value provided for " + key + ".";
                                                }
                                            }
                                        }
                                    }
                                });
                                if (!matchflag && config.required) {
                                    sfdcRecord.valid = false;
                                    sfdcRecord.invalidReason = sfdcRecord.invalidReason + " " + config.sfFieldName + " is not provided.";
                                }
                            });
                            sfdcRecord.invalidReason = sfdcRecord.invalidReason.trim();
                            //if (!sfdcRecord.valid) {
                            sfdcRecord.rowdata = record;
                            //}
                            sfdcRecords.push(sfdcRecord);
                        });

                        var totalInsert = 0;
                        var totalUpdate = 0;
                        var totalFail = 0;
                        var totalInvalid = 0;
                        var resultJSON = [];

                        var insertUploadHistory = function (totalInsert, totalUpdate, totalInvalid, totalFail) {
                            var userUploadHistory = {};

                            if (totalInvalid + totalFail > 0) {
                                //Insert Result for the Invalid Record
                                userUploadHistory = {
                                    filename: fileName,
                                    createdby: username,
                                    recordsinserted: totalInsert,
                                    recordsupdated: totalUpdate,
                                    recordsfailed: totalFail,
                                    invalidrecords: totalInvalid,
                                    uploadresult: resultJSON
                                };
                            }
                            else {
                                //Don't Insert Result for the Valid Record
                                userUploadHistory = {
                                    filename: fileName,
                                    createdby: username,
                                    recordsinserted: totalInsert,
                                    recordsupdated: totalUpdate,
                                    recordsfailed: totalFail,
                                    invalidrecords: totalInvalid
                                };
                            }

                            db.UsersUploadHistory.create(userUploadHistory)
                                .then(function (recinserted) {
                                    return res.json({
                                        success: true,
                                        message: "Users upload operation performed successfully. You can check User Upload Report for status."
                                    });
                                });
                        };

                        var usernameexistinMobile = false;
                        var checkUsernameexistinMobile = function (username, callback) {
                            if (global.UserMapping.isMobileActive) {
                                var instanceurl = process.env.INSTANCE_URL || "http://localhost:3000";
                                instanceurl = instanceurl + '/api/admin/user/checkusernameexist/';
                                console.log("URL: " + instanceurl);

                                request({
                                    url: instanceurl,
                                    method: 'Post',
                                    headers: {
                                        [config.constant.X_ACCESS_TOKEN_HEADER]: req.headers[config.constant.X_ACCESS_TOKEN_HEADER]
                                    },
                                    json: {
                                        username: username
                                    }
                                }, function (error, response, body) {
                                    if (error) {
                                        usernameexistinMobile = true;
                                        callback();
                                    }
                                    else {
                                        if (response.body.success) {
                                            usernameexistinMobile = true;
                                            callback();
                                        }
                                        else {
                                            callback();
                                        }
                                    }
                                });
                            }
                            else {
                                callback();
                            }
                        };

                        //Insert or Update Data into Salesforce
                        var index = -1;
                        sfdcRecords.forEach(function (record) {
                            index = index + 1;
                            if (record.valid) {
                                delete record.valid;
                                delete record.invalidReason;
                                delete record.index;
                                record.rowdata.Result = "";
                                var rowData = record.rowdata;
                                delete record.rowdata;

                                //Check Username exist in Mobile or not
                                checkUsernameexistinMobile(record[usernamefield], function () {
                                    if (!usernameexistinMobile) {
                                        var where = { [global.UserMapping.UsernameField.name]: record[usernamefield] };

                                        global.sfdc.sobject(global.UserMapping.SObject.name)
                                            .select('Id')
                                            .where(where)
                                            .execute(function (err, user) {
                                                if (user) {
                                                    if (user.length == 0) {
                                                        //Create new user
                                                        if (req.body.ignoreBlank) {
                                                            var keys = Object.keys(record);
                                                            keys.forEach(function (key) {
                                                                if (record[key] == "") {
                                                                    delete record[key];
                                                                }
                                                            });
                                                        }
                                                        global.sfdc.sobject(global.UserMapping.SObject.name)
                                                            .create(record, function (err, ret) {
                                                                if (err || !ret.success) {
                                                                    totalFail = totalFail + 1;
                                                                    record.rowdata = rowData;
                                                                    record.rowdata.Result = "Failed to Create";
                                                                    resultJSON.push(record.rowdata);
                                                                }
                                                                else {
                                                                    totalInsert = totalInsert + 1;
                                                                    record.rowdata = rowData;
                                                                    record.rowdata.Result = "Record Created";
                                                                    resultJSON.push(record.rowdata);
                                                                }
                                                                if (sfdcRecords.length == index + 1 && (totalInsert + totalUpdate + totalInvalid + totalFail) == index + 1) {
                                                                    insertUploadHistory(totalInsert, totalUpdate, totalInvalid, totalFail);
                                                                }
                                                            });
                                                    }
                                                    else {
                                                        //Update existing user
                                                        if (req.body.ignoreBlank) {
                                                            var keys = Object.keys(record);
                                                            keys.forEach(function (key) {
                                                                if (record[key] == "") {
                                                                    delete record[key];
                                                                }
                                                            });
                                                        }
                                                        record.Id = user[0].Id;
                                                        global.sfdc.sobject(global.UserMapping.SObject.name)
                                                            .update(record, function (err, ret) {
                                                                if (err || !ret.success) {
                                                                    totalFail = totalFail + 1;
                                                                    record.rowdata = rowData;
                                                                    record.rowdata.Result = "Failed to Update";
                                                                    resultJSON.push(record.rowdata);
                                                                }
                                                                else {
                                                                    totalUpdate = totalUpdate + 1;
                                                                    record.rowdata = rowData;
                                                                    record.rowdata.Result = "Record Updated";
                                                                    resultJSON.push(record.rowdata);
                                                                }
                                                                if (sfdcRecords.length == index + 1 && (totalInsert + totalUpdate + totalInvalid + totalFail) == index + 1) {
                                                                    insertUploadHistory(totalInsert, totalUpdate, totalInvalid, totalFail);
                                                                }
                                                            });
                                                    }
                                                }
                                            });
                                    }
                                    else {
                                        totalFail = totalFail + 1;
                                        record.rowdata = rowData;
                                        record.rowdata.Result = "Record already exist in mobile";
                                        resultJSON.push(record.rowdata);
                                        if (sfdcRecords.length == index + 1 && (totalInsert + totalUpdate + totalInvalid + totalFail) == index + 1) {
                                            insertUploadHistory(totalInsert, totalUpdate, totalInvalid, totalFail);
                                        }
                                    }
                                });
                            }
                            else {
                                record.rowdata.Result = record.invalidReason;
                                resultJSON.push(record.rowdata);
                                delete record.valid;
                                delete record.index;
                                delete record.invalidReason;
                                delete record.rowdata;

                                totalInvalid = totalInvalid + 1;
                                if (sfdcRecords.length == index + 1 && (totalInsert + totalUpdate + totalInvalid + totalFail) == index + 1) {
                                    insertUploadHistory(totalInsert, totalUpdate, totalInvalid, totalFail);
                                }
                            }
                        });

                    });
                };
            }
        });
});

userconfigRouter.post('/createFile', function (req, res) {
    var record = db.UsersUploadHistory.findAll({
        attributes: {
            exclude: ['id', 'recordsinserted', 'recordsupdated', 'recordsfailed', 'invalidrecords', 'createdby', 'createdAt', 'updatedAt']
        },
        where: {
            id: req.body.id
        }
    });

    record.then(function (_record) {
        if (_record === undefined || _record === null) {
            return res.json({
                success: false,
                message: 'Error occured while fetching data.'
            });
        } else {
            var file = path.join(os.tmpdir(), "Result" + timestamp.now() + ".csv");

            // //Create a file
            // var filewriter = fs.createWriteStream(file, {});

            // //Write result into file
            // var keys = Object.keys(_record[0].uploadresult);
            // keys.forEach(function (key) {
            //     filewriter.write(key + ": " + _record[0].uploadresult[key] + "\r\n");
            // });

            // //Close file
            // filewriter.end();

            var keys = Object.keys(_record[0].uploadresult[0]);
            var csv = json2csv({ data: _record[0].uploadresult, fields: keys });
            fs.writeFile(file, csv, function (err) {
                if (err) {
                    return res.json({
                        success: false
                    });
                }
                else {
                    return res.json({
                        success: true,
                        data: {
                            file: file,
                            filename: _record[0].filename
                        }
                    });
                }
            });
        }
    });
});

userconfigRouter.post('/getFile', function (req, res) {
    fs.createReadStream(req.body.file, { bufferSize: 64 * 1024 }).pipe(res);
});

userconfigRouter.post('/deleteFile', function (req, res) {
    var file = req.body.file;
    fs.unlinkSync(file, (err) => {
        if (err) {
            console.log(err);
        }
    });
});

module.exports = userconfigRouter;