var express = require('express');
var request = require('request');
var archivalRouter = express.Router();


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
        var headers = {
            "Content-type": "application/json; charset=utf8",
            //"Authorization": "Basic ZXNtRGV2VXNlcjpha3JpdGl2QDEyMw==",
            "Authorization": "Basic "+global.config.archivalConfig.AWSS3Secret,
            //"impl": "esmDev"
            "impl" : global.config.archivalConfig.ImplementationName
        }
        request.post({
            //url: "http://54.88.100.146:8080/AkritivArchiveApp/archive/process/search",
            url:global.config.archivalConfig.AWSS3Url,
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
module.exports = archivalRouter;