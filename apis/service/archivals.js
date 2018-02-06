var express = require('express');
var request = require('request');
var archivalRouter = express.Router();
var AWS = require('aws-sdk');

archivalRouter.post('/archivaltabs', function (req, res) {
    var SObjectLayouts = db.SObjectLayout.findAll({
        include: [{
            model: db.SObject,
            attributes: {
                exclude: ['labelPlural', 'createdAt', 'updatedAt', 'keyPrefix', 'custom', 'customSetting', 'createable', 'deletable', 'layoutable', 'mergeable', 'queryable', 'replicateable', 'retrieveable', 'updateable', 'forMobile', 'config']
            }
        }],
        attributes: {
            exclude: ['whereClause', 'created', 'active', 'createdAt', 'updatedAt', 'type']
        },
        where: {
            created: true,
            active: true,
            type: 'Archival'

        }
    });
    SObjectLayouts.then(function (sObjectLayouts) {
        console.log("SObjectLayouts:::", sObjectLayouts);
        if (sObjectLayouts === undefined || sObjectLayouts === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading archivals tabs.'
            });
        } else {
            return res.json({
                success: true,
                archivaltabs: sObjectLayouts
            });
        }
    });
});

archivalRouter.post('/loadLayout', function (req, res) {
    var LayoutId = req.body.LayoutId;
    var SObjectLayouts = db.SObjectLayout.findOne({
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
            id: LayoutId,
            created: true,
            active: true
        }
    });
    SObjectLayouts.then(function (sObjectLayouts) {
        console.log("SObjectLayouts", sObjectLayouts);
        if (sObjectLayouts === undefined || sObjectLayouts === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading layouts fields and data.'
            });
        } else {
            var SObjectLayoutFields = db.SObjectLayoutField.findAll({
                include: [{
                    model: db.SObjectField,
                    attributes: {
                        exclude: ['createdAt', 'updatedAt']
                    },
                    include: [{
                        model: db.ArchivalSobjectField,
                        attributes: {
                            exclude: ['createdAt', 'updatedAt']
                        },
                        where: {
                            ArchivalSobjectId: sObjectLayouts.ArchivalSobjectId
                        },
                    }],
                }],
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                },
                where: {
                    SObjectLayoutId: LayoutId
                },
                order: [
                    ['order']
                ]
            });
            SObjectLayoutFields.then(function (fields) {
                console.log("SObjectLayoutFields::", fields);

                if (fields === undefined || fields === null) {
                    return res.json({
                        success: false,
                        message: 'Error occured while loading report fields and data.'
                    });
                } else {
                    var criteriaFields = [];
                    var resultFields = [];
                    fields.forEach(function (field) {
                        if (field.type == 'Search-Criteria-Field') {
                            criteriaFields.push(field);
                        }
                        else {
                            resultFields.push(field);
                        }
                    });
                    return res.json({
                        success: true,
                        sObjectLayouts: sObjectLayouts,
                        fields: fields.length,
                        criteriaFields: criteriaFields,
                        resultFields: resultFields
                    });
                }
            });
        }
    });
});

archivalRouter.post('/search', function (req, res) {
    var queryObject = req.body;
    console.log("queryObject:::", queryObject);
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
    var ArchivalSobjects = db.ArchivalSobject.findOne({
        include: [{
            model: db.ArchivalSobjectField,
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            },
            include: [{
                model: db.SObjectField,
                attributes: ['name']
            }],
        }],
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        },
        where: {
            id: queryObject.ArchivalSobjectId,
        },
    });
    ArchivalSobjects.then(function (archivalSobjects) {
        console.log("ArchivalSobjects:", archivalSobjects);
        var sobjectDataField = [];
        var whereCluase = {};
        if (queryObject && queryObject.whereFields && queryObject.whereFields.hasOwnProperty('$and')) {
            queryObject.whereFields['$and'].forEach(function (criteria, index) {
                for (key in criteria) {
                    if (criteria[key].type && (criteria[key].type === 'date' || criteria[key].type === 'datetime')) {
                        var type = criteria[key].type;
                        delete criteria[key].type;
                        for (innerKey in criteria[key]) {
                            if (innerKey === '$gt') {
                                if (type === 'date') {
                                    whereCluase[key + '@@from@@'] = criteria[key][innerKey] + "";
                                }
                                else {
                                    whereCluase[key + '@@from@@'] = criteria[key][innerKey] + "" + "T00:00:00Z  ";
                                }
                            }
                            else {
                                if (type === 'date'){
                                    whereCluase[key + '@@to@@'] = criteria[key][innerKey] + "";
                                }
                                else{
                                    whereCluase[key + '@@to@@'] = criteria[key][innerKey] + "" + "T00:00:00Z  ";
                                }
                            }
                        }
                    }
                    else {
                        if (criteria[key].type) {
                            delete criteria[key].type;
                            for (innerKey in criteria[key]) {
                                if (innerKey === '$gt') {
                                    whereCluase[key + '@@from@@'] = criteria[key][innerKey] + "";
                                } else {
                                whereCluase[key + '@@to@@'] = criteria[key][innerKey] + "";
                                }
                            }
                        }
                    }
                }
            });
        }
        archivalSobjects.ArchivalSobjectFields.forEach(function (field) {
            if (("," + selectFields + ",").indexOf("," + field.SObjectField.name + ",") != -1) {
                sobjectDataField.push(field.name.toLowerCase());
            }
            if (req.body.whereFields[field.SObjectField.name] != undefined) {
                whereCluase[field.name] = '' + req.body.whereFields[field.SObjectField.name];
            }
        });
        console.log("req.body.whereFields", req.body.whereFields)
        console.log("req.body.whereFields", whereCluase)
        var base64encode=new Buffer(global.config.archivalConfig.GenericDB.AWSS3Key+':'+global.config.archivalConfig.GenericDB.AWSS3Secret,'UTF-8');
        var secret = base64encode.toString('base64');
        
        var headers = {
            "Content-type": "application/json; charset=utf8",
            //"Authorization": "Basic ZXNtRGV2VXNlcjpha3JpdGl2QDEyMw==",
            "Authorization": "Basic " + secret,
            //"impl": "esmDev"
            //"impl": global.config.archivalConfig.GenericSearch.AWSS3Key
            "impl": global.config.archivalConfig.ImplementationName
        }
        request.post({
            //url: "http://54.88.100.146:8080/AkritivArchiveApp/archive/process/search",
            //url: "http://54.88.100.146/AkritivArchiveApp/archive/process",
            url: global.config.archivalConfig.GenericDB.AWSEC2Url  +"/search",
            headers: headers,
            json: {
                columns: [],
                filters: whereCluase,
                table: archivalSobjects.name
            } 
        }, function (err, httpResponse, body) {
            if (err) return res.json({ success: false, message: err });
            return res.json({ success: true, data: { searchResult: body.records } });
        });

    });

});

archivalRouter.post('/getConfigdata', function (req, res) {
    var archivalConfig = db.ArchivalConfig.findOne({
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        },
        where: {
            ObjectName: req.body.SObject.name
        }
    });
    archivalConfig.then(function (archivalConfig) {
        console.log("archivalConfig:::", archivalConfig);
        if (archivalConfig === undefined || archivalConfig === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading config data.'
            });
        } else {

            return res.json({
                success: true,
                data: {
                    configData: archivalConfig
                }
            });
        }
    });
});

archivalRouter.post('/details', function (req, res) {
    var queryObject = req.body;
    var ArchivalSobjects = db.ArchivalSobject.findOne({
        include: [{
            model: db.ArchivalSobjectField,
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            },
            include: [{
                model: db.SObjectField,
                attributes: ['name']
            }],
        }],
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        },
        where: {
            id: queryObject.ArchivalSobjectId,
        },
    });
    ArchivalSobjects.then(function (archivalSobjects) {
        console.log("ArchivalSobjects:", archivalSobjects);
        var uniqueKeyFieldName = "";
        var whereCluase = {};
        archivalSobjects.ArchivalSobjectFields.forEach(function (field) {
            if (field.SObjectField.name.toLowerCase() == queryObject.archivalMetaData.ObjectUniqueIdentifier.toLowerCase()) {
                uniqueKeyFieldName = field.name.toLowerCase();
            }
        });
        var S3RootFolder = '';
        global.config.archivalConfig.ObjectSetup.forEach(function (objectSetup) {
            if (objectSetup.ObjectName.toLowerCase() == queryObject.sobject.name.toLowerCase()) {
                S3RootFolder = objectSetup.S3RootFolder;
            }
        });

        //var s3 = new AWS.S3({ accessKeyId: "AKIAIVT7MWOS2HOX6OBA", secretAccessKey: "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", region: "us-east-1" }); // Pass in opts to S3 if necessary
        var s3 = new AWS.S3({ accessKeyId: global.config.archivalConfig.GenericS3.AWSS3Key, secretAccessKey: global.config.archivalConfig.GenericS3.AWSS3Secret, region: global.config.archivalConfig.GenericS3.AWSS3Region });
        var getParams = {
            //Bucket: 'eipp-genpact', // your bucket name,
            Bucket: global.config.archivalConfig.GenericS3.AWSS3Bucket,
            // Key: 'shared1/ESMQA/Invoice/ESMI-00000781/ESMI-00000781.JSON' // path to the object you're looking for
            Key: S3RootFolder + '/' + queryObject.recrods[uniqueKeyFieldName] + '/' + queryObject.recrods[uniqueKeyFieldName] + '.JSON'
            //Key: 'shared1/ESMQA/Invoice/' + queryObject.recrods[uniqueKeyFieldName] + '/' + queryObject.recrods[uniqueKeyFieldName] + '.JSON' // path to the object you're looking for
        }

        s3.getObject(getParams, function (err, data) {
            // Handle any error and exit
            if (err) {
                return res.json({
                    success: false,
                    data: {
                        dataModel: null
                    }
                });
            }
            var objectData = data.Body.toString('utf-8'); // Use the encoding necessary
            console.log('data', JSON.parse(objectData));
            var recordJSON = JSON.parse(objectData);

            return res.json({
                success: true,
                data: {
                    dataModel: recordJSON,

                }
            });
        });
    });
});

archivalRouter.post('/searchDetails', function (req, res) {
    var queryObject = req.body;
    //var s3 = new AWS.S3({ accessKeyId: "AKIAIVT7MWOS2HOX6OBA", secretAccessKey: "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", region: "us-east-1" }); // Pass in opts to S3 if necessary
    var s3 = new AWS.S3({ accessKeyId: global.config.archivalConfig.GenericS3.AWSS3Key, secretAccessKey: global.config.archivalConfig.GenericS3.AWSS3Secret, region: global.config.archivalConfig.GenericS3.AWSS3Region });
    var S3RootFolder = '';
    var ParentField = '';
    global.config.archivalConfig.ObjectSetup.forEach(function (objectSetup) {
        if (objectSetup.ObjectName.toLowerCase() == queryObject.sObject.name.toLowerCase()) {
            S3RootFolder = objectSetup.S3RootFolder;
            ParentField = objectSetup.ParentField.split(".")[1];
        }
        else if (queryObject.sObject.name.toLowerCase().endsWith('__history') && objectSetup.ObjectName.toLowerCase() == queryObject.SObjectField.referenceTo[0].toLowerCase()) {
            S3RootFolder = objectSetup.S3RootFolder;
            ParentField = objectSetup.ObjectUniqueIdentifier;
        }
    });

    var urlKey = '';
    Object.keys(queryObject.dataModel).forEach((sObjectkey) => {
        if (sObjectkey.toLowerCase() == ParentField.toLowerCase()) {
            urlKey = queryObject.dataModel[sObjectkey];
        }
    });
    var params = {
        Bucket: global.config.archivalConfig.GenericS3.AWSS3Bucket,
        Delimiter: '/',
        Prefix: S3RootFolder + '/' + urlKey + '/'
    }
    s3.listObjects(params, function (err, fileContent) {
        if (err) throw err;
        console.log(fileContent);
        var cnt = 0;
        var finalResponseJSON = [];
        if (fileContent.Contents.length == 0) {
            return res.json({
                success: true,
                data: {
                    dataModel: finalResponseJSON,
                }
            });
        }
        fileContent.Contents.forEach(function (content) {
            var isValid = 0;
            if (queryObject.sObject.name.toLowerCase().endsWith('__history') && content.Key.toLowerCase().startsWith((S3RootFolder + '/' + urlKey + '/' + urlKey + '_history').toLowerCase())) {
                isValid = 1;
            }
            if (!queryObject.sObject.name.toLowerCase().endsWith('__history')) {
                isValid = 1;
            }
            if (isValid == 1) {
                var getParams = {
                    //Bucket: 'eipp-genpact', // your bucket name,
                    Bucket: global.config.archivalConfig.GenericS3.AWSS3Bucket,
                    Key: content.Key // path to the object you're looking for
                }
                s3.getObject(getParams, function (err, data) {
                    cnt++;
                    // Handle any error and exit
                    if (err) {
                        return res.json({
                            success: false,
                            data: {
                                dataModel: null
                            }
                        });
                    }
                    var objectData = data.Body.toString('utf-8'); // Use the encoding necessary
                    console.log('data', JSON.parse(objectData));
                    var recordJSON = JSON.parse(objectData);
                    finalResponseJSON = finalResponseJSON.concat(recordJSON);
                    if (cnt == fileContent.Contents.length) {
                        return res.json({
                            success: true,
                            data: {
                                dataModel: finalResponseJSON,
                            }
                        });
                    }

                });
            }
            else {
                cnt++;
                if (cnt == fileContent.Contents.length) {
                    return res.json({
                        success: true,
                        data: {
                            dataModel: finalResponseJSON,
                        }
                    });
                }

            }
        });
    });
});
module.exports = archivalRouter;