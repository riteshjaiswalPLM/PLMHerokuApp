var express = require('express');
var componentRouter = express.Router();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var timestamp = require('unix-timestamp');
var http = require('http');
var os = require('os');
var request = require('request');
var mime = require('mime');

componentRouter.post('/deletefile', function(req, res){
    var filePath = path.join(os.tmpdir(),req.body.fileName);

    fs.exists(filePath, function(exists) {
        if(exists) {
            fs.unlink(filePath, function(err){
                if(err){
                    return res.json({
                        success: false,
                        message: 'Not able to delete file.'
                    });
                }
                return res.json({
                    success: true,
                });
            });
        } 
        else {
            return res.json({
                success: true,
            });
        }
    });
});

componentRouter.post('/savepopupattachment', function (req, res) {
    var attachmentDetails = req.body; 
    var attachmentIdArray = [];
    if(attachmentDetails.files && attachmentDetails.files.length > 0){
        attachmentDetails.files.forEach(function(fileToBeSaved){
            fs.readFile(path.join(os.tmpdir(),fileToBeSaved.fileName), function(err, fileData) {
                if (err){
                    console.error(err);
                    deleteAttachment(attachmentIdArray);
                    return res.json({
                        success: false,
                        message: 'Error occured while saving attchment attachments.',
                    });
                }
                else{
                    var fileObj = { 
                        ParentId: attachmentDetails.id,
                        Name : fileToBeSaved.originalFileName,
                        Body: new Buffer(fileData).toString('base64'),
                        ContentType : fileToBeSaved.fileType,
                        Description : JSON.parse(JSON.parse(req.cookies.user).userdata).Id  
                    };
                    global.sfdc.sobject('Attachment').create(fileObj, function(err, ret){
                        if(err || !ret.success){
                            deleteAttachment(attachmentIdArray);
                            return res.json({
                                success: false,
                                message: 'Error occured while saving attchment attachments.',
                            });
                        }
                        else{
                            attachmentIdArray.push(ret.id);
                            if(attachmentIdArray.length === attachmentDetails.files.length){
                                return res.json({
                                    success: true,
                                });
                            }
                        }
                    });
                }
            });
        });
    }
    else{
        return res.json({
            success: true,
        });
    }
});

var deleteAttachment = function(attachmentIdArray){
    attachmentIdArray.forEach(function(attachmentId){
        global.sfdc.sobject('Attachment').destroy(attachmentId);
    });
};
componentRouter.post('/deleteexistingattachment', function (req, res) {
    var attachment=req.body;
    console.log('data',attachment.Id);
    console.log('data',JSON.parse(JSON.parse(req.cookies.user).userdata).Id);
    global.sfdc.sobject('Attachment')
    .find({ id : attachment.Id,Description : JSON.parse(JSON.parse(req.cookies.user).userdata).Id })
    .destroy(function(err,result){
        if(err){
             return res.json({
                success: false,
                message: "Error while deleting File.",
                err:err
            });
        }
        if(result.length>0){
            return res.json({
                success: true,
                filename: attachment.Name,
                message: "File Deleted successfully"
            });
        }
        else{
            return res.json({
                success: false,
                filename: attachment.Name,
                message: "File Not Found or Already Deleted"
            });
        }
        // console.log(result.length>0);
        //  return res.json({
        //     success: true,
        //     filename: attachment.Name,
        //     message: message
        // });
    }).catch(function(err){
         return res.json({
            success: false,
            message: "Error while deleting File.",
            err:err
        });
    });
});
componentRouter.post('/getfiledata', function (req, res) {
    var config = {
        method: 'GET',
        uri: global.sfdc.instanceUrl+req.body.body,
        headers: {
            "Authorization": "Bearer "+global.sfdc.accessToken
        }
    };
    console.log('accessToken in file download :: ', global.sfdc.accessToken);
    var stream = request(config).pipe(fs.createWriteStream(os.tmpdir()+'/'+req.body.name, {autoClose: true}));
    stream.on('finish',function(){
        fs.createReadStream(stream.path, {bufferSize: 64 * 1024}).pipe(res);
    });
});

componentRouter.post('/uploadedfilelist', function(req, res){
    var columnToBeSelected = "Id, IsDeleted, ParentId, Name, ContentType, BodyLength, Body, CreatedDate, Description";
    var whereCluse = {
        ParentId: req.body.parentId
    };
    global.sfdc.sobject('Attachment')
        .select(columnToBeSelected)
        .where(whereCluse)
        .execute(function(err, records){
            if(err){
                return res.json({
                    success: false,
                    message: 'Error occured while loading attchment detail.',
                    error: err
                });
            }

            return res.json({
                success: true,
                data: {
                    attachments: records
                }
            });
        });
});

componentRouter.post('/upload', function(req, res){
    var form = new formidable.IncomingForm();
    var fileName;
    form.multiples = true;
    form.uploadDir = os.tmpdir();
    form.parse(req);

    form.on('file', function(field, file) {
        fileName = file.name+'_'+timestamp.now();
        fs.rename(file.path, path.join(form.uploadDir, file.isPrimary ? file.name+'_'+'primary'+'_'+timestamp.now() : file.name+'_'+timestamp.now()));
    });

    form.on('error', function(err) {
        return res.json({
            success: false,
            error: err
        });
    });

    form.on('end', function() {
        return res.json({
            success: true,
            fileName: fileName
        });
    });
});

componentRouter.post('/invoicelineitems', function(req, res){
    var invoiceData = req.body;
    var queryFields = [];
    var whareClause = {};
    invoiceData.componentConfig.fields.forEach(function(field){
        if(queryFields.indexOf(field.SObjectField.name) === -1){
            // queryFields.push(field.SObjectField.name);
            queryFields.push(field.SObjectField.name);
            if(field.SObjectField.type === 'reference'){
                if(field.SObjectField.reference === undefined){
                    queryFields.push(field.SObjectField.relationshipName + '.Name');
                }else{
                    queryFields.push(field.SObjectField.relationshipName + '.' +field.SObjectField.reference);
                }
            }
        }
    });
    whareClause[invoiceData.componentConfig.parent.name] = invoiceData.invoiceId;
    whareClause['Is_Other_Charge__c'] = true; 
    global.sfdc
        .sobject(invoiceData.componentConfig.parent.name)
        .select('Amount__c')
        .where({Id:invoiceData.invoiceId})
        .execute(function(err, record){
            if(err){
                return res.json({
                    success: false,
                    message: 'Error occured while loading invoice line item.',
                    error: err
                });
            }

            global.sfdc
            .sobject(invoiceData.componentConfig.child.name)
            .select(queryFields.toString())
            .where(whareClause)
            .execute(function(err, records){
                if(err){
                    return res.json({
                        success: false,
                        message: 'Error occured while loading invoice line item.',
                        error: err
                    });
                }
                else if(records.length === 0){
                    return res.json({
                        success: true,
                        data: {
                            dataModelList: [],
                            invoiceAmount: record[0].Amount__c
                        }
                    });
                }
                return res.json({
                    success: true,
                    data: {
                        dataModelList: records,
                        invoiceAmount: record[0].Amount__c
                    }
                });
            });
        });
});

componentRouter.post('/savecostallocationdata', function(req, res){
    var costAllocationData = req.body.dataModelList;
    var sObject = req.body.sObject;
    var listToBeDeleted = [], listToBeUpdated = [], listToBeInserted = [];

    var updateLineItems = function(){
        if(listToBeUpdated.length > 0){
            global.sfdc.sobject(sObject).update(listToBeUpdated, function(err, ret) {
                if(err){
                    return res.json({
                        success: false,
                        message: 'Error occured while saving invoice line item.'
                    });
                }
                deleteLineItems();
            });
        }
        else{
            deleteLineItems();
        }
    };

    var deleteLineItems = function(){
        if(listToBeDeleted.length > 0){
            global.sfdc.sobject(sObject).destroy(listToBeDeleted, function(err, ret) {
                if(err){
                    return res.json({
                        success: false,
                        message: 'Error occured while saving invoice line item.'
                    });
                }
            });
        }
        else{
            return res.json({
                success: true
            });
        }
    };

    costAllocationData.forEach(function(costAllocationLineItem){
        if(costAllocationLineItem.hasOwnProperty('attributes') && costAllocationLineItem.attributes != null){
            var id = costAllocationLineItem.attributes.url.substr(costAllocationLineItem.attributes.url.lastIndexOf("/")+1, costAllocationLineItem.attributes.url.length); 
            if(costAllocationLineItem.isDeleted && costAllocationLineItem.isPersisted){
                listToBeDeleted.push(id);
            }
            else if(!costAllocationLineItem.isDeleted && costAllocationLineItem.isPersisted){
                var updatedValueObj = {};
                for (var key in costAllocationLineItem){
                    if(key.indexOf('__c') > -1){
                        updatedValueObj[key] = costAllocationLineItem[key];
                    }
                }
                updatedValueObj['Is_Other_Charge__c'] = true;
                updatedValueObj.Id = id;
                listToBeUpdated.push(updatedValueObj); 
            }
        }
        else if(!costAllocationLineItem.isPersisted && !costAllocationLineItem.isDeleted){
            var valueObj = {};
            for (var key in costAllocationLineItem){
                if(key.indexOf('__c') > -1){
                    valueObj[key] = costAllocationLineItem[key];
                }
            };
            valueObj['Is_Other_Charge__c'] = true;
            listToBeInserted.push(valueObj);
        }
    });
    if(listToBeInserted.length > 0){
        global.sfdc.sobject(sObject).create(listToBeInserted, function(err, ret) {
            if(err){
                return res.json({
                    success: false,
                    message: 'Error occured while saving invoice line item.'
                });
            }
            updateLineItems();
        });
    }
    else{
        updateLineItems();
    }
    console.log(listToBeDeleted);
    console.log(listToBeUpdated);
    console.log(listToBeInserted);
});

componentRouter.post('/getinvoicelineitemdata', function(req, res){
    var invoiceData = req.body;
    var queryFields = [];
    var whareClause = {};
    var amountFieldName=invoiceData.amountFieldName;
    var othercharagefieldname=invoiceData.othercharageFieldName;
    var invoicelookupFieldName=invoiceData.invoicelookupFieldName;
    var isOtherCharage=invoiceData.isOtherCharage;
    var childAmountFieldName=invoiceData.childAmountFieldName;
    var totalAmount=0.0;
     
    invoiceData.componentConfig.fields.forEach(function(field){
        if(queryFields.indexOf(field.SObjectField.name) === -1){
            queryFields.push(field.SObjectField.name);
            if(field.SObjectField.type === 'reference'){
                if(field.SObjectField.reference === undefined){
                    queryFields.push(field.SObjectField.relationshipName + '.Name');
                }else{
                    queryFields.push(field.SObjectField.relationshipName + '.' +field.SObjectField.reference);
                }
            }
        }
    });
    whareClause[invoicelookupFieldName] =invoiceData.invoiceId;
    whareClause[othercharagefieldname] = isOtherCharage;
            global.sfdc
            .sobject(invoiceData.componentConfig.child.name)
            .select(queryFields.toString())
            .where(whareClause)
            .execute(function(err, records){
                if(err){
                    return res.json({
                        success: false,
                        message: 'Error occured while loading invoice line item.',
                        error: err
                    });
                }
                else if(records.length === 0){
                    return res.json({
                        success: true,
                        data: {
                            dataModelList: [],
                            invoiceAmount: 0
                        }
                    });
                }

                records.forEach(function(recordData){
                    if(recordData[childAmountFieldName]){
                        totalAmount+=isNaN(recordData[childAmountFieldName]) ? 0 : parseFloat(parseFloat(recordData[childAmountFieldName]).toFixed(3));
                    }

                });

                return res.json({
                    success: true,
                    data: {
                        dataModelList: records,
                        invoiceAmount: totalAmount
                    }
                });
            });
});


componentRouter.post('/saveinvoicelineitemdata', function(req, res){
    var costAllocationData = req.body.dataModelList;
    var sObject = req.body.sObject;
    var InvID = req.body.InvID;
    var listToBeDeleted = [], listToBeUpdated = [], listToBeInserted = [];
    var invoiceFieldName=req.body.invoicelookupFieldName;
    var othercharageFieldName=req.body.othercharageFieldName;
    var isOtherCharage=req.body.isOtherCharage;
     

    var updateLineItems = function(){
        if(listToBeUpdated.length > 0){
            global.sfdc.sobject(sObject).update(listToBeUpdated, function(err, ret) {
                if(err){
                    return res.json({
                        success: false,
                        message: 'Error occured while saving invoice line item.',
                        err:err.toString()
                    });
                }
                deleteLineItems();
            });
        }
        else{
            deleteLineItems();
        }
    };

    var deleteLineItems = function(){
        if(listToBeDeleted.length > 0){
            global.sfdc.sobject(sObject).destroy(listToBeDeleted, function(err, ret) {
                if(err){
                    return res.json({
                        success: false,
                        message: 'Error occured while saving invoice line item.',
                        err:err.toString()
                    });
                }
                return res.json({
                    success: true
                });
                
            });
        }
        else{
            return res.json({
                success: true
            });
        }
    };

    costAllocationData.forEach(function(costAllocationLineItem){
        if(costAllocationLineItem.hasOwnProperty('attributes') && costAllocationLineItem.attributes != null){
            var id = costAllocationLineItem.attributes.url.substr(costAllocationLineItem.attributes.url.lastIndexOf("/")+1, costAllocationLineItem.attributes.url.length); 
            if(costAllocationLineItem.isDeleted && costAllocationLineItem.isPersisted){
                listToBeDeleted.push(id);
            }
            else if(!costAllocationLineItem.isDeleted && costAllocationLineItem.isPersisted){
                var updatedValueObj = {};
                for (var key in costAllocationLineItem){
                    if(key.indexOf('__c') > -1){
                        updatedValueObj[key] = costAllocationLineItem[key];
                    }
                }
                updatedValueObj[othercharageFieldName] = isOtherCharage;
                updatedValueObj.Id = id;
                listToBeUpdated.push(updatedValueObj); 
            }
        }
        else if(!costAllocationLineItem.isPersisted && !costAllocationLineItem.isDeleted){
            var valueObj = {};
            for (var key in costAllocationLineItem){
                if(key.indexOf('__c') > -1){
                    valueObj[key] = costAllocationLineItem[key];
                }
            };
            valueObj[othercharageFieldName] = isOtherCharage;
            valueObj[invoiceFieldName]=InvID;
            listToBeInserted.push(valueObj);
        }
    });
    if(listToBeInserted.length > 0){
        global.sfdc.sobject(sObject).create(listToBeInserted, function(err, ret) {
            if(err){
                return res.json({
                    success: false,
                    message: 'Error occured while saving invoice line item.',
                    err:err.toString()
                });
            }
            updateLineItems();
        });
    }
    else{
        updateLineItems();
    }
  
});


componentRouter.post('/getSobjectFields', function(req, res){
    var sObject = req.body;
    var SObjectFields = db.SObjectField.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: {
            SObjectId: sObject.id
        }
    });
    
    SObjectFields.then(function(sObjectFields) {
        if(sObjectFields === undefined || sObjectFields === null){
            return res.json({
                success: false,
                message: 'Error occured while loading sobject fields.'
            });
        }else{
            var referenceSObjectNames = [];
            sObjectFields.forEach(function(field){
                if(field.type === 'reference' && referenceSObjectNames.indexOf(field.referenceTo[0]) === -1){
                    referenceSObjectNames.push(field.referenceTo[0]);
                }
            });
            var referenceSObjects = db.SObject.findAll({
                attributes: {
                    exclude: ['createdAt','updatedAt']
                },
                include: {
                    model: db.SObjectField,
                    attributes: {
                        exclude: ['createdAt','updatedAt']
                    }
                },
                where: {
                    name: {
                        $in: referenceSObjectNames
                    }
                }
            });
            referenceSObjects.then(function(refSObjects){
                var _refSObjects = {};
                refSObjects.forEach(function(refSObject){
                    _refSObjects[refSObject.name] = refSObject;
                });
                return res.json({
                    success: true,
                    data: {
                        sObjectFields: sObjectFields,
                        refSObjects: _refSObjects                           
                    }
                });
            });
        }
    });
});

componentRouter.post('/changerequestlist', function(req, res){
    var columnToBeSelected = "Id, Name ";
    var sObject = req.body;
    var suppMaintSobjectDetail=undefined;
    var CurrentFieldName='';
    var ProposedFieldName='';
    var IsRequiredFieldName='';
    var cnt=0;
    var SObjects = global.db.SObject.findAll({
            include: {
                model: db.SObjectField,
                attributes: {
                    exclude: ['createdAt','updatedAt']
                }
            },
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        });
    
    SObjects.then(function(sObjects) {
        if(sObjects === undefined || SObjects === null){
            return res.json({
                success: false,
                message: 'Error occured while loading local sobjects.'
            });
        }else{
            
            sObjects.forEach(function(sObjectData){
                if(sObjectData.name.indexOf('SuppMaintenance_Change_Request_Mapping__c') != -1){
                    suppMaintSobjectDetail=sObjectData;
                }
            });

            if(suppMaintSobjectDetail === undefined ){
                return res.json({
                    success: false,
                    message: 'Error occured while loading Change Request Component detail.'
                });
            }

            suppMaintSobjectDetail.SObjectFields.forEach(function(sObjectFieldsData){
                if(sObjectFieldsData.name.indexOf('Current_Field__c') != -1){
                        columnToBeSelected+=","+sObjectFieldsData.name;
                        CurrentFieldName=sObjectFieldsData.name;
                }
                else if(sObjectFieldsData.name.indexOf('Proposed_Field__c') != -1){
                        columnToBeSelected+=","+sObjectFieldsData.name;
                        ProposedFieldName=sObjectFieldsData.name;
                }
                else if(sObjectFieldsData.name.indexOf('Is_Required__c') != -1){
                        columnToBeSelected+=","+sObjectFieldsData.name;
                        IsRequiredFieldName=sObjectFieldsData.name;
                }
            });

            global.sfdc.sobject(suppMaintSobjectDetail.name)
                .select(columnToBeSelected)
                .execute(function(err, records){
                    if(err){
                        return res.json({
                            success: false,
                            message: 'Error occured while loading Change Request Component detail.',
                            error: err
                        });
                    }
                    
                    var sObjectFieldsData={};
                    var SObjectFields = db.SObjectField.findAll({
                        attributes: {
                            exclude: ['createdAt','updatedAt']
                        },
                        where: {
                            SObjectId: sObject.id
                        }
                    });
                    
                    SObjectFields.then(function(sObjectFields) {
                        if(sObjectFields === undefined || sObjectFields === null){
                            return res.json({
                                success: false,
                                message: 'Error occured while loading Change Request Component detail.'
                            });
                        }
                        else{
                            sObjectFields.forEach(function(sObjectField){
                                if(!sObjectFieldsData[sObjectField.name]){
                                    sObjectFieldsData[sObjectField.name] = {};
                                }
                                sObjectFieldsData[sObjectField.name].SObjectField=sObjectField;
                                sObjectFieldsData[sObjectField.name].rendered=true;
                            });
                            var changeRequestFieldsDetail = [];
                            var fields = {}
                            records.forEach(function(record){
                                changeRequestFieldsDetail.push({ 
                                    Name: record.Name,
                                    label : sObjectFieldsData[record[CurrentFieldName]].SObjectField.label,
                                    Current_Field__c: record[CurrentFieldName],
                                    Proposed_Field__c : record[ProposedFieldName],
                                    Is_Required__c:record[IsRequiredFieldName]
                                });
                                fields[record.Name] = sObjectFieldsData[record[CurrentFieldName]];
                                fields[record.Name].required=record[IsRequiredFieldName]
                            });
                
                            return res.json({
                                success: true,
                                data: {
                                    records: changeRequestFieldsDetail,
                                    fields: fields
                                }
                            });
                        }
                    });
                });
        }
    });        
    
});
componentRouter.post('/getrecorddetail', function(req, res){
    var sObjectName=req.body.sObjectName;
    var whereCluse={
        Id: req.body.id
    }
    console.log('uniqueSObjectFields = '+JSON.stringify(req.body));
    SObjects = global.db.SObject.findAll({
            attributes: {
                exclude: ['createdAt','updatedAt']
            },
            include: {
                model: global.db.SObjectField,
                attributes: {
                    exclude: ['createdAt','updatedAt']
                }
            },
            where: {
                name: sObjectName
            }
    });

    SObjects.then(function(sObjects) {
        if(sObjects === undefined || SObjects === null){
            return res.json({
                success: false,
                message: 'Error occured while loading record Detail.'
            });
        }else{
            var uniqueSObjectFields = '';
            var cnt =0;
            sObjects.forEach(function(sObject){      
                var sObjectFields=sObject.SObjectFields;
                sObjectFields.forEach(function(sObjectField){
                    if(cnt==0)
                    {
                        uniqueSObjectFields=sObjectField.name;
                        cnt++;
                    }
                    else{
                        uniqueSObjectFields+=','+sObjectField.name;
                    }
                });
            });
            console.log('uniqueSObjectFields = '+uniqueSObjectFields);
            global.sfdc.sobject(sObjectName)
                .select(uniqueSObjectFields)
                .where(whereCluse)
                .execute(function(err, records){
                    if(err){
                        return res.json({
                            success: false,
                            message: 'Error occured while loading record Detail.',
                            error: err
                        });
                    }
                    return res.json({
                        success: true,
                        data: {
                            records: records[0]
                        }
                    });
                });
        }
    });
    
});

componentRouter.post('/getapprovalhistory', (req, res)=>{
    var body = req.body;
    global.sfdc
    .sobject(body.selectObj)
    .select(global.sObjectFieldListConfig.FieldListMap[body.selectObj])
    .where(body.whereClause)
    .execute((err, records)=>{
        if(err){
            return res.json({
                success: false,
                message: 'Error occured while loading invoice line item.',
                error: err
            });
        }
        else if(records.length === 0){
            return res.json({
                success: true,
                data: {
                    dataModelList: [],
                }
            });
        }
        return res.json({
            success: true,
            data: {
                dataModelList: records
            }
        });
    });
});

componentRouter.post('/saveapprovers', (req, res)=>{
    var dataModelList = req.body.dataModelList, recordsToBeUpdated = [], recordsToBeCreated = [], recordsToBeDeleted = [];
    dataModelList.forEach((dataModel)=>{
        Object.keys(dataModel).forEach((apiName)=>{
            if(apiName.indexOf('__r') > -1){
                delete dataModel[apiName];
            }
        });
    });
    dataModelList.forEach((dataModel)=>{
        if(dataModel['Id'] === undefined){
            delete dataModel.deleted;
            delete dataModel.recalled;
            recordsToBeCreated.push(dataModel);
        }
        else if(dataModel['deleted'] === true){
            delete dataModel.deleted;
            delete dataModel.recalled;
            recordsToBeDeleted.push(dataModel.Id);
        }
        else{
            delete dataModel.deleted;
            if(dataModel.recalled !== undefined && dataModel.recalled === true) dataModel[req.body.approvalDetailStatusAPI] = 'Recalled';
            delete dataModel.recalled;
            recordsToBeUpdated.push(dataModel);
        }
    });
    global.sfdc.sobject(req.body.sObject).create(recordsToBeCreated, function(err, ret) {
        if(err){
            return res.json({
                success: false,
                message: 'Error occured while saving approver user.',
                err: err.toString()
            });
        }
        global.sfdc.sobject(req.body.sObject).update(recordsToBeUpdated, function(err, ret) {
            if(err){
                return res.json({
                    success: false,
                    message: 'Error occured while updating approver user.',
                    err: err.toString()
                });
            }
            global.sfdc.sobject(req.body.sObject).del(recordsToBeDeleted, function(err, ret) {
                if(err){
                    return res.json({
                        success: false,
                        message: 'Error occured while deleting approver user.',
                        err: err.toString()
                    });
                }
                res.json({
                    success: true,
                });
            });
        });
    });
});

module.exports = componentRouter;