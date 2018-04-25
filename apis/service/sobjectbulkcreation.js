var express = require('express');
var sobjectbulkuploadRouter = express.Router();

sobjectbulkuploadRouter.post('/save', function (req, res) {
    var queryObject = req.body;
    console.log(queryObject.records);

    console.log("uploadRecords ====================================");
    try {
        global.db.Salesforce.findAll().then(function (sfdcs) {
            var sfdc = sfdcs[0];
            if (sfdc === null || sfdc === undefined) {
                callback && callback({
                    message: 'Error occured while loading salesforce configurations!!!'
                }, null);
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

                console.info(">>> CREATING NEW CONNECTION ------------------------------- >>>");
                console.info(">>> username      : " + sfdc.username);
                console.info(">>> password      : " + sfdc.password + sfdc.token);

                jsForceConnection.login(sfdc.username, sfdc.password + (sfdc.token ? sfdc.token : ''), function (err, userInfo) {
                    if (err) {
                        console.error(err);
                        callback && callback({
                            message: 'Error occured while creating new connection with salesforce!!!'
                        });
                    } else {
                        jsForceConnection.bulk.pollInterval = 5000; // 5 sec
                        jsForceConnection.bulk.pollTimeout = 120000; // 120 sec
                        jsForceConnection.sobject(queryObject.sObjectName)
                            .createBulk(queryObject.records, function (err, result) {
                                console.log("res received from SF ====================================");
                                if (err) {
                                    console.log("err ====================================");
                                    console.log(err);
                                    console.log("err ====================================");
                                    jsForceConnection.logout();
                                    return res.json({
                                        success: true,
                                        message: 'Processing Error...'
                                    });
                                } else {
                                    for (var i = 0; i < result.length; i++) {
                                        if (result[i].success) {
                                            console.log("#" + (i + 1) + " loaded successfully, id = " + result[i].id);
                                        } else {
                                            console.log("#" + (i + 1) + " error occurred, message = " + result[i].errors.join(', '));
                                        }
                                    }
                                    jsForceConnection.logout();
                                    return res.json({
                                        success: true,
                                        message: 'Processing Done...'
                                    });
                                }
                            });
                    }
                });
            } else {
                callback && callback({
                    message: 'Invalid salesforce credentials!!!. Please verify.'
                }, null);
            }
        });
    }
    catch (err1) {
        console.log('eer', err1);
    }
});

module.exports = sobjectbulkuploadRouter;