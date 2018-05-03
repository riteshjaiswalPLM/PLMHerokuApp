var express = require('express');
var os = require('os');
var timestamp = require('unix-timestamp');
var path = require('path');
var json2csv = require('json2csv');
var sobjectbulkuploadRouter = express.Router();

sobjectbulkuploadRouter.post('/getUploadHistory', function (req, res) {
    global.sfdc
        .sobject('CSV_Load_History__c')
        .select(['Id', 'File_Name__c', 'CreatedDate', 'Error_Status__c'])
        .where({ Updated_By__c: JSON.parse(JSON.parse(req.cookies.user).userdata).Id })
        .orderby("CreatedDate", "DESC")
        .execute(function (err, records) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Error occured while loading upload history.'
                });
            }
            else {
                return res.json({
                    success: true,
                    data: {
                        historyRecords: records
                    }
                });
            }
        });
});

sobjectbulkuploadRouter.post('/createFile', function (req, res) {
    global.sfdc
        .sobject('Attachment')
        .select(['Id', 'Name', 'Body'])
        .where({ ParentId: req.body.id })
        .execute(function (err, records) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Error occured while fetching data.'
                });
            }
            else {
                return res.json({
                    success: true,
                    data: {
                        record: records[0],
                    }
                });
            }
        });
});

sobjectbulkuploadRouter.post('/save', function (req, res) {
    var queryObject = req.body;
    console.log("START==========================================");
    console.log(new Date());
    console.log("START==========================================");

    global.db.Salesforce.findAll().then(function (sfdcs) {
        var sfdc = sfdcs[0];
        if (sfdc === null || sfdc === undefined) {
            return res.json({
                success: false,
                error: 'Error occured while loading salesforce configurations!!!'
            });
        } else if (sfdc.environment !== null || sfdc.environment !== '') {
            var jsForce = require('jsforce');
            var jsForceConnection = new jsForce.Connection({
                loginUrl: (sfdc.environment === 'SANDBOX') ? 'https://test.salesforce.com' : 'https://login.salesforce.com',
                maxRequest: 500
            });
            console.log({
                username: sfdc.username,
                password: sfdc.password,
                token: sfdc.token,
                sfdcPassword: sfdc.password + sfdc.token
            });

            console.info("1>>> CREATING NEW CONNECTION ------------------------------- >>>");
            console.info("1>>> username      : " + sfdc.username);
            console.info("1>>> password      : " + sfdc.password + sfdc.token);

            jsForceConnection.login(sfdc.username, sfdc.password + (sfdc.token ? sfdc.token : ''), function (err, userInfo) {
                if (err) {
                    console.error(err);
                    return res.json({
                        success: false,
                        error: 'Error occured while creating new connection with salesforce!!!'
                    });
                } else {
                    var startUploadInBackground = function () {
                        jsForceConnection.bulk.pollInterval = 5000; // 5 sec
                        jsForceConnection.bulk.pollTimeout = 120000; // 120 sec
                        var start = 0;
                        var stop = 25;
                        var results = [];
                        try {
                            let startUploadInBatch = (records, start, stop, results) => {
                                if (records.length == 0) {
                                    var resultArr = [];
                                    var isError = false;
                                    console.log("Final recs length " + queryObject.records.length);
                                    console.log("Final res length " + results.length);
                                    queryObject.records.forEach(function (rec, index) {
                                        var resultRec = rec;
                                        resultRec.id = results[index].id;
                                        resultRec.success = results[index].success;
                                        if (!isError && results[index].errors != null && results[index].errors.length > 0) {
                                            isError = true;
                                        }
                                        resultRec.errors = results[index].errors.join(', ');
                                        resultArr.push(resultRec);
                                    });

                                    var file = path.join(os.tmpdir(), "Result" + timestamp.now() + ".csv");
                                    var keys = Object.keys(resultArr[0]);
                                    var csv = json2csv({ data: resultArr, fields: keys });

                                    var CSVLoadHistoryObj = {
                                        File_Name__c: queryObject.filename,
                                        Error_Status__c: isError,
                                        Updated_By__c: JSON.parse(JSON.parse(req.cookies.user).userdata).Id
                                    };
                                    jsForceConnection.sobject('CSV_Load_History__c').create(CSVLoadHistoryObj, function (CSVLoadHistoryObjerr, CSVLoadHistoryObjret) {
                                        if (CSVLoadHistoryObjerr) {
                                            console.log(CSVLoadHistoryObjerr);
                                            jsForceConnection.logout();
                                        }
                                        else {
                                            var AttachmentObj = {
                                                ParentId: CSVLoadHistoryObjret.id,
                                                Name: queryObject.filename,
                                                Body: new Buffer(csv).toString('base64'),
                                                ContentType: 'application/csv',
                                                Description: JSON.parse(JSON.parse(req.cookies.user).userdata).Id
                                            };
                                            jsForceConnection.sobject('Attachment').create(AttachmentObj, function (AttachmentObjerr, AttachmentObjret) {
                                                if (AttachmentObjerr) {
                                                    jsForceConnection.logout();
                                                }
                                                else {
                                                    console.log("END==========================================");
                                                    console.log(new Date());
                                                    console.log("END==========================================");
                                                    jsForceConnection.logout();
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    jsForceConnection.sobject(queryObject.sObjectName)
                                        .createBulk(records, function (err, result) {
                                            if (err) {
                                                console.log("err ====================================");
                                                console.log(err);
                                                console.log("err ====================================");
                                                for (var i = start; i < stop; i++) {
                                                    var tmpRes = {};
                                                    tmpRes.errors = [];
                                                    tmpRes.errors.push(err.message);
                                                    results.push(tmpRes);
                                                }
                                                start = stop;
                                                stop = stop + 25;
                                                startUploadInBatch(queryObject.records.slice(start, stop), start, stop, results);
                                            } else {
                                                result.forEach(function (resrec) {
                                                    results.push(resrec);
                                                });
                                                start = stop;
                                                stop = stop + 25;
                                                startUploadInBatch(queryObject.records.slice(start, stop), start, stop, results);
                                            }
                                        });
                                }
                            };
                            startUploadInBatch(queryObject.records.slice(start, stop), start, stop, results);
                        }
                        catch (e) {
                            console.log("recursive err " + e);
                        }
                    };
                    startUploadInBackground();
                    return res.json({
                        success: true,
                        message: "Upload request has been acknowledged. Please view upload report after some time to check the result."
                    });
                }
            });
        } else {
            return res.json({
                success: false,
                error: 'Invalid salesforce credentials!!!. Please verify.'
            });
        }
    });
});

sobjectbulkuploadRouter.post('/getSelectedFields', function (req, res) {
    var SObjectFields = db.SObjectField.findAll({
        attributes: {
            include: ['id', 'controllerName', 'SObjectId']
        },
        where: {
            id: {
                $in: req.body
            }
        }
    });

    SObjectFields.then(function (sObjectFields) {
        if (sObjectFields === undefined || sObjectFields === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading sobject fields.'
            });
        } else {
            var names = [];
            sObjectFields.forEach(function (field, index) {
                names.push(field.controllerName);
            });
            var SObjectCtrlFields = db.SObjectField.findAll({
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                },
                where: {
                    name: {
                        $in: names
                    },
                    SObjectId: sObjectFields[0].SObjectId
                }
            });

            SObjectCtrlFields.then(function (sObjectCtrlFields) {
                if (sObjectCtrlFields === undefined || sObjectCtrlFields === null) {
                    return res.json({
                        success: false,
                        message: 'Error occured while loading sobject fields.'
                    });
                } else {
                    sObjectCtrlFields.forEach(function (field) {
                        sObjectFields.forEach(function (cfield) {
                            if (cfield.controllerName == field.name) {
                                field.dataValues.ctrlID = cfield.id;
                            }
                        });
                    });
                    return res.json({
                        success: true,
                        data: {
                            sObjectFields: sObjectCtrlFields
                        }
                    });
                }
            });
        }
    });
});

module.exports = sobjectbulkuploadRouter;