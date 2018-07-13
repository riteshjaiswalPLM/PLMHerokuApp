var express = require('express');
var archivalcomponentRouter = express.Router();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var timestamp = require('unix-timestamp');
var http = require('http');
var os = require('os');
var request = require('request');
var mime = require('mime');
var AWS = require('aws-sdk');

archivalcomponentRouter.post('/getfiledata', function (req, res) {
    var s3 = new AWS.S3({ accessKeyId: global.config.archivalConfig.GenericS3.AWSS3Key, secretAccessKey: global.config.archivalConfig.GenericS3.AWSS3Secret, region: global.config.archivalConfig.GenericS3.AWSS3Region });
    var filepath = req.body.path;
    var getParams = {
        Bucket: global.config.archivalConfig.GenericS3.AWSS3Bucket,
        Key: filepath
    }
    res.attachment(filepath);
    var fileStream = s3.getObject(getParams).createReadStream();
    fileStream.pipe(res);
});

archivalcomponentRouter.post('/uploadedfilelist', function (req, res) {
    var queryObject = req.body;
    var render = false;
    var S3RootFolder = '';
    var ParentField = '';
    debugger;
    global.config.archivalConfig.ObjectSetup.forEach(function (objectSetup) {
        if (objectSetup.ObjectName.toLowerCase() == queryObject.name.toLowerCase()) {
            S3RootFolder = objectSetup.S3RootFolder;
            ParentField = objectSetup.ObjectUniqueIdentifier;
            render = objectSetup.HasAttachments;
        }
    });

    if (render) {
        AWS.config.update({ accessKeyId: global.config.archivalConfig.GenericS3.AWSS3Key, secretAccessKey: global.config.archivalConfig.GenericS3.AWSS3Secret, region: global.config.archivalConfig.GenericS3.AWSS3Region });
        var s3 = new AWS.S3();
        var urlKey = '';
        Object.keys(queryObject.dataModel).forEach((sObjectkey) => {
            if (sObjectkey.toLowerCase() == ParentField.toLowerCase()) {
                urlKey = queryObject.dataModel[sObjectkey];
            }
        });
        var params = {
            Bucket: global.config.archivalConfig.GenericS3.AWSS3Bucket,
            Delimiter: '/',
            Prefix: S3RootFolder + '/' + urlKey + '/' + 'Attachments' + '/'
        }
        s3.listObjects(params, function (err, data) {
            if (err) {
                return res.json({
                    success: false,
                    render: render,
                    data: {
                        attachments: null
                    }
                });
            }
            return res.json({
                success: true,
                render: render,
                data: {
                    attachments: data.Contents
                }
            });
        });
    }
    else {
        return res.json({
            success: true,
            render: render,
            data: null
        });
    }
});
module.exports = archivalcomponentRouter;