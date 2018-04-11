var express = require('express');
var csvUploadconfigRouter = express.Router();
var validator = require('validator');
var moment = require('moment');
var request = require('request');
var os = require('os');
var timestamp = require('unix-timestamp');
var path = require('path');
var fs = require('fs');
var json2csv = require('json2csv');
var batch = require('batchflow');

csvUploadconfigRouter.post('/getfieldmapping', function (req, res) {
    var CSVUploadConfigs = db.CSVUploadConfig.findAll({
        include: [{
            model: db.SObject,
            include: {
                model: db.SObjectField,
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                }
            },
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        }, {
            model: db.SObject,
            as: "detailSObject",
            include: {
                model: db.SObjectField,
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                }
            },
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        }],
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        },
        order: [
            ['id']
        ]
    });

    CSVUploadConfigs.then(function (CSVUploadConfig) {
        if (CSVUploadConfig === undefined || CSVUploadConfig === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading field mapping.'
            });
        } else {
            var referenceSObjectNames = [];
            CSVUploadConfig.forEach(function (field, ind) {
                if (field.datatype === 'reference' && referenceSObjectNames.indexOf(field.referenceSObjectName) === -1) {
                    referenceSObjectNames.push(field.referenceSObjectName);
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
                        mappedFields: CSVUploadConfig,
                        refSObjects: _refSObjects
                    }
                });
            });
        }
    });
});

csvUploadconfigRouter.post('/savefieldmapping', function (req, res) {
    var fieldsmappings = req.body;
    var recordsToInsert = [];

    fieldsmappings.forEach(function (fieldsmapping) {
        var SObjectType = '';
        if (fieldsmapping.isOf == 'mainSObject') {
            SObjectType = 'SObjectId';
        }
        else if (fieldsmapping.isOf == 'detailSObject') {
            SObjectType = 'detailSObjectId';
        }
        if (fieldsmapping.type == 'datetime' || fieldsmapping.type == 'date') {
            recordsToInsert.push({
                sfFieldName: fieldsmapping.name,
                label: fieldsmapping.label,
                csvFieldName: fieldsmapping.csvFieldName,
                datatype: fieldsmapping.type,
                datatypeFormat: fieldsmapping.csvFieldFormat,
                required: !fieldsmapping.nillable,
                isUniqueField: fieldsmapping.isUniqueField,
                [SObjectType]: fieldsmapping[SObjectType],
                defaultValue: fieldsmapping.defaultValue
            });
        }
        else if (fieldsmapping.type == 'reference') {
            recordsToInsert.push({
                sfFieldName: fieldsmapping.name,
                label: fieldsmapping.label,
                csvFieldName: fieldsmapping.csvFieldName,
                datatype: fieldsmapping.type,
                required: !fieldsmapping.nillable,
                isUniqueField: fieldsmapping.isUniqueField,
                referenceTableName: fieldsmapping.referenceTo[0],
                referenceFieldName: fieldsmapping.reference,
                [SObjectType]: fieldsmapping[SObjectType],
                defaultValue: fieldsmapping.defaultValue
            });
        }
        else if (fieldsmapping.type == 'string') {
            recordsToInsert.push({
                sfFieldName: fieldsmapping.name,
                label: fieldsmapping.label,
                csvFieldName: fieldsmapping.csvFieldName,
                datatype: fieldsmapping.type,
                stringLength: fieldsmapping.length,
                required: !fieldsmapping.nillable,
                isUniqueField: fieldsmapping.isUniqueField,
                [SObjectType]: fieldsmapping[SObjectType],
                defaultValue: fieldsmapping.defaultValue
            });
        }
        else {
            recordsToInsert.push({
                sfFieldName: fieldsmapping.name,
                label: fieldsmapping.label,
                csvFieldName: fieldsmapping.csvFieldName,
                datatype: fieldsmapping.type,
                required: !fieldsmapping.nillable,
                isUniqueField: fieldsmapping.isUniqueField,
                [SObjectType]: fieldsmapping[SObjectType],
                defaultValue: fieldsmapping.defaultValue
            });
        }
    });

    //Delete existing mapping
    db.CSVUploadConfig.destroy({ where: {} });

    db.CSVUploadConfig.bulkCreate(recordsToInsert)
        .then(function () {
            return res.json({
                success: true
            });
        });
});

module.exports = csvUploadconfigRouter;