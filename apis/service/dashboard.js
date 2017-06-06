var express = require('express');
var dashboardRouter = express.Router();
var XlsxPopulate  = require('xlsx-populate');
var timestamp = require('unix-timestamp');
var path = require('path');
var os = require('os');
var fs = require('fs');

dashboardRouter.post('/getdashboardcomponentmetadata', function(req, res){
    var slds = req.body && req.body.slds === true;
    var mapComponentDetailWithContainer = (dashboarContainers, components)=>{
       dashboarContainers.forEach((container)=>{
            container.DashboardContainersComponents.forEach((component)=>{
                components.forEach((_component)=>{
                    if(_component.id === component.ComponentId){
                        component.dataValues.Component = JSON.parse(JSON.stringify(_component));
                    }
                });
            })
        });
        return res.json({
            success: true,
            data: {
                containerMetadata: dashboarContainers
            }
        });
    };
    var DashboarContainer = db.DashboarContainer.findAll({
        include: {
            model: db.DashboardContainersComponents,
            attributes: {
                exclude: ['createdAt','updatedAt','deleted','DashboarContainerId']
            },
            where: {
                active: true
            }
        },
        attributes: {
            exclude: ['createdAt','updatedAt','title','deleted']
        },
        order: [
            ['order'],
            [db.DashboardContainersComponents, 'order']
        ]
    });

    DashboarContainer.then((dashboarContainers)=>{
        if(dashboarContainers.length === 0){
            return res.json({
                success: true,
                data: {
                    containerMetadata: dashboarContainers
                }
            });
        }
        var whereClause = [], _dashboarContainers = dashboarContainers;
        dashboarContainers.forEach((container)=>{
            container.DashboardContainersComponents.forEach((component)=>{
                whereClause.push(component.ComponentId);
            })
        });
        var Components = db.Components.findAll({
            attributes: {
                exclude: ['createdAt','updatedAt','desc','SObjectId']
            },
            include: [{
                model: db.ComponentDetail,
                attributes: {
                    exclude: ['createdAt','updatedAt']
                }
            },{
                model: db.SObject,
                attributes: {
                    exclude: ['createdAt','updatedAt']
                },
                include:{
                    model: db.SObjectLayout,
                    attributes: {
                        exclude: ['createdAt','updatedAt']
                    }
                }
            },{
                model: db.SObject,
                as: 'detailSObject',
                attributes: {
                    exclude: ['createdAt','updatedAt']
                },
                include:{
                    model: db.SObjectLayout,
                    attributes: {
                        exclude: ['createdAt','updatedAt']
                    }
                }
            }],
            where: {
                id: {$in: whereClause},
                active: true
            }
        });

        Components.then((components)=>{
            var _components = components, buttonCriteria;
            components.forEach((component, index)=>{
                component.ComponentDetails[0].dataValues.recordActions = [];
                var sObject = (component.detailSObject !== undefined && component.detailSObject !== null) ? component.detailSObject : component.SObject;  
                sObject.SObjectLayouts.forEach(function(_sObjLayout){
                    if(_sObjLayout.created && _sObjLayout.active && _sObjLayout.type !== 'List' && _sObjLayout.type !== 'Mobile' && _sObjLayout.type !== 'Create'){
                        var action = {
                            type: 'record',
                            label: _sObjLayout.type,
                            icon: (_sObjLayout.type === 'Edit') ? (slds) ? 'edit' : 'pficon-edit' : (slds) ? 'preview' : 'fa fa-eye',
                            state: 'client.' + sObject.keyPrefix + '.' + _sObjLayout.type.toLowerCase(),
                            btnClass: (_sObjLayout.type === 'Edit') ? 'btn btn-xs btn-primary' : 'btn btn-xs btn-default'
                        }
                        component.ComponentDetails[0].dataValues.recordActions.push(action);
                    }
                    else if(_sObjLayout.type === 'List'){
                        buttonCriteria = _sObjLayout.btnCriteria;
                    }
                });
                component.ComponentDetails[0].dataValues.recordActions.forEach((action, index)=>{
                    if(buttonCriteria !== null){
                        buttonCriteria.forEach((btncriteria)=>{
                            if(action.label === btncriteria.keyName){
                                component.ComponentDetails[0].dataValues.recordActions[index].criteria = btncriteria.criteria;
                            }
                        });
                    }
                });
                var ComponentDetail = JSON.parse(JSON.stringify(component.ComponentDetails[0]));
                ComponentDetail.configuration.name = component.SObject.name;
                delete component.dataValues.ComponentDetails;
                delete component.dataValues.SObject;
                component.dataValues.ComponentDetail = ComponentDetail;
                if(index === _components.length - 1){
                    mapComponentDetailWithContainer(_dashboarContainers, _components);
                }
            });
        });
    });
});

dashboardRouter.post('/loadData', function(req, res){
    var config = req.body.config;
    var componentType = req.body.type;
    var selectFields = [], whereClause = "";
    if(componentType.indexOf('MyTaskContainer') > -1){
        selectFields.push('Id');
        config.fields.forEach((field)=>{
            if(selectFields.indexOf(field.SObjectField.name) === -1) selectFields.push(field.SObjectField.name);
            if(field.SObjectField.type === 'reference'){
                selectFields.push(field.SObjectField.relationshipName + '.' + field.reference)
            }
        });
        if(config.whereClause){
            whereClause = config.whereClause.indexOf('{LOGGED_IN_USER}') > -1 ? config.whereClause.replace(/{LOGGED_IN_USER}/g, JSON.parse(JSON.parse(req.cookies.user).userdata).Name) : config.whereClause
        }
        global.sfdc
        .sobject(config.name)
        .select(selectFields)
        .where(whereClause)
        .limit(100)
        .execute(function(err, records){
            if(err){
                return res.json({
                    success: false,
                    message: 'Error occured while searching records.\n'+err.name + ' : ' + err.message,
                    error: err
                });
            }
            var hasMore = false;
            // if(records.length > queryObject.limit){
            //     hasMore = true;
            //     records.pop();
            // }
            return res.json({
                success: true,
                data: {
                    records: records,
                    // currentPage: (records.length === 0) ? 0 : queryObject.page,
                    // hasMore: hasMore
                }
            });
        });
    }
    else{
        return res.json({success: true});
    }
});

dashboardRouter.post('/exportData', function (req, res) {
    var config = req.body.config;
    var componentType = req.body.type;
    var selectFields = [], whereClause = "";
    if (componentType.indexOf('MyTaskContainer') > -1) {
        selectFields.push('Id');
        config.fields.forEach((field) => {
            if (selectFields.indexOf(field.SObjectField.name) === -1) selectFields.push(field.SObjectField.name);
            if (field.SObjectField.type === 'reference') {
                selectFields.push(field.SObjectField.relationshipName + '.' + field.reference)
            }
        });
        if (config.whereClause) {
            whereClause = config.whereClause.indexOf('{LOGGED_IN_USER}') > -1 ? config.whereClause.replace(/{LOGGED_IN_USER}/g, JSON.parse(JSON.parse(req.cookies.user).userdata).Name) : config.whereClause
        }
        global.sfdc
            .sobject(config.name)
            .select(selectFields)
            .where(whereClause)
            //.limit(10)
            .execute(function (err, records) {
                if (err) {
                    return res.json({
                        success: false,
                        message: 'Error occured while searching records.\n' + err.name + ' : ' + err.message,
                        error: err
                    });
                }
                records.forEach(function (record, index) {
                    delete record.attributes;
                    delete record.Id;

                    var keys = Object.keys(record);
                    var innerKeys = [];
                    var innerJSON;
                    keys.forEach(function (key) {
                        if (Object.prototype.toString.call(record[key]) === "[object Object]") {
                            if (record[key].hasOwnProperty('attributes')) {
                                delete record[key]['attributes'];
                            }
                            if (record[key].hasOwnProperty('Id')) {
                                delete record[key]['Id'];
                            }

                            var oneRecAttrKeys = Object.keys(record[key]);
                            oneRecAttrKeys.forEach(function (oneRecAttrKey) {
                                if (oneRecAttrKey != "Name") {
                                    innerKeys.push(oneRecAttrKey);
                                }
                            });
                        }
                    });

                    var keysTobeDeleted = [];
                    var fieldChanged = false;
                    keys.forEach(function (key) {
                        fieldChanged = false;
                        config.fields.forEach(function (field) {
                            if (key == field.SObjectField.name && !fieldChanged) {
                                if (field.hidden == false) {
                                    if (field.SObjectField.type === 'reference') {
                                        if (record[field.SObjectField.relationshipName] == null) {
                                            record[field.label] = record[field.SObjectField.relationshipName];
                                            delete record[key];
                                            delete record[field.SObjectField.relationshipName];
                                            if (keys.indexOf(field.SObjectField.relationshipName) > -1) {
                                                keys.splice(keys.indexOf(field.SObjectField.relationshipName), 1);
                                            }
                                        } else {
                                            record[field.label] = record[field.SObjectField.relationshipName][field.reference];
                                            delete record[key];
                                            delete record[field.SObjectField.relationshipName][field.reference];
                                            keysTobeDeleted.push(field.SObjectField.relationshipName);
                                        }
                                    } else {
                                        record[field.SObjectField.label] = record[key];
                                        delete record[key];
                                    }
                                }
                                else {
                                    delete record[key];
                                }
                                fieldChanged = true;
                            }
                        });

                        if (fieldChanged == false) {
                            if (!(Object.prototype.toString.call(record[key]) === "[object Object]" && Object.keys(record[key]).length > 0)) {
                                delete record[key];
                            }
                            else {
                                if (innerJSON == null || innerJSON == undefined) {
                                    innerJSON = record[key];
                                } else {
                                    var allKeys = Object.keys(record[key]);
                                    allKeys.forEach(function (allKey) {
                                        innerJSON[allKey] = record[key][allKey];
                                    });
                                }
                                delete record[key];
                            }
                        }
                    });

                    keysTobeDeleted.forEach(function (key) {
                        if (record[key] != null && record[key] != undefined) {
                            delete record[key];
                        }
                    });

                    innerKeys.forEach(function (key, index) {
                        fieldChanged = false;
                        config.fields.forEach(function (field) {
                            if (field.hidden == false) {
                                if (key == field.reference && !fieldChanged) {
                                    if (innerJSON != null && innerJSON != undefined) {
                                        record[field.label] = innerJSON[key];
                                        delete innerJSON[key];
                                        fieldChanged = true;
                                    }
                                }
                            }
                            else {
                                delete innerJSON[key];
                                fieldChanged = true;
                            }
                        });

                        if (fieldChanged == false) {
                            if (innerJSON != null && innerJSON != undefined) {
                                delete innerJSON[key];
                            }
                        }
                    });
                });

                if (records.length > 0) {
                    var file = "MyTaskResult" + timestamp.now() + ".xlsx";
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
    }
    else {
        return res.json({
            success: true
        });
    }
});

dashboardRouter.post('/getfiledata', function (req, res) {
    fs.createReadStream(req.body.file, { bufferSize: 64 * 1024 }).pipe(res);
});

dashboardRouter.post('/deletefile', function (req, res) {
    var file = req.body.file;
    fs.unlinkSync(file, (err) => {
        if (err) {
            console.log(err);
        }
    });
});

module.exports = dashboardRouter;