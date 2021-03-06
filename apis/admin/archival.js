var express = require('express');
var request = require('request');
var archivalRouter = express.Router();
var _ = require('underscore');
var jsForce = require('jsforce');

archivalRouter.post('/sync', function (req, res) {
    var queryObject = req.body;
    //ArchivalSetupDetail
    global.sfdc
        .sobject("arcsol__ArchivalSetupDetail__c")
        .select('*')
        .execute(function (err, records) {
            console.log('daaa', records);

            if (err) {
                return res.json({
                    success: false,
                    message: err.toString(),
                    error: err,
                    err: err.toString()
                });
            }
            else if (records === undefined || records === null || records.length === 0) {
                return res.json({
                    success: false,
                    message: 'No such record found!'
                });
            }
            else {
                var itemsProcessed = 0;
                records.forEach(function (rec) {

                    db.ArchivalSetupDetail.findOrCreate({
                        where: {
                            ArchivalNamespace: rec.Name
                        },
                        defaults: {
                            ArchivalNamespace: rec.Name,
                            AWSEC2Url: rec.arcsol__AWSEC2Url__c,
                            AWSS3Bucket: rec.arcsol__AWSS3Bucket__c,
                            AWSS3Key: rec.arcsol__AWSS3Key__c,
                            AWSS3Region: rec.arcsol__AWSS3Region__c,
                            AWSS3Secret: rec.arcsol__AWSS3Secret__c,
                            AWSS3Service: rec.arcsol__AWSS3Service__c,
                            AWSS3Url: rec.arcsol__AWSS3Url__c,
                            BatchSizeConfiguration: rec.arcsol__BatchSizeConfiguration__c,
                            EnableSSEncryption: rec.arcsol__EnableSSEncryption__c,
                        }

                    }).spread(function (archivalSetupDetail, created) {
                        itemsProcessed++;
                        console.log("ArchivalSetupDetail::", archivalSetupDetail);
                        if (!created) {
                            db.ArchivalSetupDetail.update({
                                AWSEC2Url: rec.arcsol__AWSEC2Url__c,
                                AWSS3Bucket: rec.arcsol__AWSS3Bucket__c,
                                AWSS3Key: rec.arcsol__AWSS3Key__c,
                                AWSS3Region: rec.arcsol__AWSS3Region__c,
                                AWSS3Secret: rec.arcsol__AWSS3Secret__c,
                                AWSS3Service: rec.arcsol__AWSS3Service__c,
                                AWSS3Url: rec.arcsol__AWSS3Url__c,
                                BatchSizeConfiguration: rec.arcsol__BatchSizeConfiguration__c,
                                EnableSSEncryption: rec.arcsol__EnableSSEncryption__c,
                            }, {
                                    where: {
                                        ArchivalNamespace: rec.Name
                                    }
                                });
                        }
                        if (itemsProcessed == records.length) {
                            global.config.archivalConfig.refreshConfig();
                            saveArchivalDetail(req, res)
                            return res.json({
                                success: true,
                                message: "sync done"
                            });
                        }
                    });
                })
            }
        }, function (err) {
            return res.json({
                success: true,
                message: "sync done"
            });
        });

    // ARCHIVAL CONFIG
    global.sfdc
        .sobject("arcsol__ArchivalConfiguration__c")
        .select('*')
        .execute(function (err, records) {
            console.log('daaa', records);

            if (err) {
                return res.json({
                    success: false,
                    message: err.toString(),
                    error: err,
                    err: err.toString()
                });
            }
            else if (records === undefined || records === null || records.length === 0) {
                return res.json({
                    success: false,
                    message: 'No such record found!'
                });
            }
            else {
                var itemsProcessed = 0;
                records.forEach(function (rec) {

                    db.ArchivalConfig.findOrCreate({
                        where: {
                            ObjectName: rec.arcsol__ObjectName__c
                        },
                        defaults: {
                            Name: rec.Name,
                            AdditionalFilterCriteria: rec.arcsol__AdditionalFilterCriteria__c,
                            ArchiveFieldHistory: rec.arcsol__Archive_Field_History__c,
                            AttachmentSource: rec.arcsol__AttachmentSource__c,
                            ChildCountFieldName: rec.arcsol__ChildCountFieldName__c,
                            EnableRecreationinSFDC: rec.arcsol__Enable_Recreation_in_SFDC__c,
                            FieldNameToCreateFieldsets: rec.arcsol__FieldNameToCreateFieldsets__c,
                            FieldSetsforDisplay: rec.arcsol__Field_Sets_for_Display__c,
                            HasAttachments: rec.arcsol__HasAttachments__c,
                            HasDetailPage: rec.arcsol__HasDetailPage__c,
                            HasNotes: rec.arcsol__HasNotes__c,
                            IsSearchable: rec.arcsol__IsSearchable__c,
                            ObjectName: rec.arcsol__ObjectName__c,
                            ObjectUniqueIdentifier: rec.arcsol__ObjectUniqueIdentifier__c,
                            Order: rec.arcsol__Order__c,
                            ParentField: rec.arcsol__ParentField__c,
                            RelatedItemsforDisplay: rec.arcsol__Related_Items_for_Display__c,
                            RelatedParentObject: rec.arcsol__RelatedParentObject__c,
                            S3RootFolder: rec.arcsol__S3RootFolder__c,
                        }

                    }).spread(function (archivalConfig, created) {
                        itemsProcessed++;
                        console.log("ArchivalConfig::", archivalConfig);
                        if (!created) {
                            db.ArchivalConfig.update({
                                Name: rec.Name,
                                AdditionalFilterCriteria: rec.arcsol__AdditionalFilterCriteria__c,
                                ArchiveFieldHistory: rec.arcsol__Archive_Field_History__c,
                                AttachmentSource: rec.arcsol__AttachmentSource__c,
                                ChildCountFieldName: rec.arcsol__ChildCountFieldName__c,
                                EnableRecreationinSFDC: rec.arcsol__Enable_Recreation_in_SFDC__c,
                                FieldNameToCreateFieldsets: rec.arcsol__FieldNameToCreateFieldsets__c,
                                FieldSetsforDisplay: rec.arcsol__Field_Sets_for_Display__c,
                                HasAttachments: rec.arcsol__HasAttachments__c,
                                HasDetailPage: rec.arcsol__HasDetailPage__c,
                                HasNotes: rec.arcsol__HasNotes__c,
                                IsSearchable: rec.arcsol__IsSearchable__c,
                                ObjectName: rec.arcsol__ObjectName__c,
                                ObjectUniqueIdentifier: rec.arcsol__ObjectUniqueIdentifier__c,
                                Order: rec.arcsol__Order__c,
                                ParentField: rec.arcsol__ParentField__c,
                                RelatedItemsforDisplay: rec.arcsol__Related_Items_for_Display__c,
                                RelatedParentObject: rec.arcsol__RelatedParentObject__c,
                                S3RootFolder: rec.arcsol__S3RootFolder__c,
                            }, {
                                    where: {
                                        ObjectName: rec.arcsol__ObjectName__c
                                    }
                                });
                        }
                        if (itemsProcessed == records.length) {
                            global.config.archivalConfig.refreshConfig();
                            saveArchivalDetail(req, res)
                            return res.json({
                                success: true,
                                message: "sync done"
                            });
                        }
                    });
                })
            }
        }, function (err) {
            return res.json({
                success: true,
                message: "sync done"
            });
        });


        // ARCHIVAL SYSTEM CONFIG
    global.sfdc
        .sobject("arcsol__Archival_System_Config__c")
        // .select('arcsol__ArchivalNamespace__c,arcsol__ArchiveFieldHistoryBatchSize__c,arcsol__ArchiveLargeAttachmentBatchSize__c, arcsol__ArchiveSObjectToS3batchSize__c, arcsol__Comma_Separated_List_of_Emails__c, arcsol__DeleteAlreadyArchivedRecordsBatchSize__c, arcsol__Down_for_maintenance__c, arcsol__Enable_Parenthetical_Currency_Conversion__c, arcsol__Enable_Server_Side_Encryption_S3__c, arcsol__Field_History_File_Size__c, arcsol__GenericArchiveAttachmentBatchSize__c, arcsol__GenericArchiveNotesBatchSize__c, arcsol__GenericArchiveRelatedItemsBatchSize__c, arcsol__GenericArchiveToRDSBatchSize__c, arcsol__ImplementationName__c, arcsol__MarkChildEligibityForDeleteBatchSize__c, arcsol__MarkParentEligibityForDeleteBatchSize__c, arcsol__MarkRecordsEligibleForDeleteBatchSize__c, arcsol__MarkRelatedItemsCountOnParentSize__c, arcsol__Parent_Batch_Size_for_Attachments__c, arcsol__Parent_Batch_Size_for_Notes__c, arcsol__VisibilityExportToCSV__c')
        .select('*')
        .where({ SetupOwnerId: global.sfdc.orgId })
        .execute(function (err, records) {
            console.log('data:::', records);
            if (err) {
                return res.json({
                    success: false,
                    message: err.toString(),
                    error: err,
                    err: err.toString()
                });
            }
            else if (records === undefined || records === null || records.length === 0) {
                return res.json({
                    success: false,
                    message: 'No such record found!'
                });
            }
            else {
                db.ArchivalSystemConfig.findOne({
                    attributes: {
                        exclude: ['createdAt', 'updatedAt']
                    }
                }).then(function (archivalSystemConfig) {
                    console.log("ArchivalSystemConfig::", archivalSystemConfig);
                    if (archivalSystemConfig === undefined || archivalSystemConfig === null) {
                        global.db.ArchivalSystemConfig
                            .build({
                                ArchivalNamespace: records[0].arcsol__ArchivalNamespace__c,
                                ArchiveFieldHistoryBatchSize: records[0].arcsol__ArchiveFieldHistoryBatchSize__c,
                                ArchiveLargeAttachmentBatchSize: records[0].arcsol__ArchiveLargeAttachmentBatchSize__c,
                                ArchiveSObjectToS3batchSize: records[0].arcsol__ArchiveSObjectToS3batchSize__c,
                                CommaSeparatedListofEmails: records[0].arcsol__Comma_Separated_List_of_Emails__c,
                                DeleteAlreadyArchivedRecordsBatchSize: records[0].arcsol__DeleteAlreadyArchivedRecordsBatchSize__c,
                                Downformaintenance: records[0].arcsol__Down_for_maintenance__c,
                                EnableParentheticalCurrencyConversion: records[0].arcsol__Enable_Parenthetical_Currency_Conversion__c,
                                EnableServerSideEncryptionS3: records[0].arcsol__Enable_Server_Side_Encryption_S3__c,
                                FieldHistoryFileSize: records[0].arcsol__Field_History_File_Size__c,
                                GenericArchiveRelatedItemsBatchSize: records[0].arcsol__GenericArchiveAttachmentBatchSize__c,
                                GenericArchiveNotesBatchSize: records[0].arcsol__GenericArchiveNotesBatchSize__c,
                                GenericArchiveRelatedItemsBatchSize: records[0].arcsol__GenericArchiveRelatedItemsBatchSize__c,
                                GenericArchiveToRDSBatchSize: records[0].arcsol__GenericArchiveToRDSBatchSize__c,
                                ImplementationName: records[0].arcsol__ImplementationName__c,
                                MarkChildEligibityForDeleteBatchSize: records[0].arcsol__MarkChildEligibityForDeleteBatchSize__c,
                                MarkParentEligibityForDeleteBatchSize: records[0].arcsol__MarkParentEligibityForDeleteBatchSize__c,
                                MarkRecordsEligibleForDeleteBatchSize: records[0].arcsol__MarkRecordsEligibleForDeleteBatchSize__c,
                                MarkRelatedItemsCountOnParentSize: records[0].arcsol__MarkRelatedItemsCountOnParentSize__c,
                                ParentBatchSizeforAttachments: records[0].arcsol__Parent_Batch_Size_for_Attachments__c,
                                ParentBatchSizeforNotes: records[0].arcsol__Parent_Batch_Size_for_Notes__c,
                                VisibilityExportToCSV: records[0].arcsol__VisibilityExportToCSV__c,
                            })
                            .save()
                            .then(function (newArchivalSystemConfig) {
                                return res.json({
                                    success: true,
                                    data: {
                                        message: "sync done"
                                    }
                                });

                            });
                        return saveArchivalDetail(records, req, res);
                    }
                    else {
                        global.db.ArchivalSystemConfig
                            .update({
                                ArchivalNamespace: records[0].arcsol__ArchivalNamespace__c,
                                ArchiveFieldHistoryBatchSize: records[0].arcsol__ArchiveFieldHistoryBatchSize__c,
                                ArchiveLargeAttachmentBatchSize: records[0].arcsol__ArchiveLargeAttachmentBatchSize__c,
                                ArchiveSObjectToS3batchSize: records[0].arcsol__ArchiveSObjectToS3batchSize__c,
                                CommaSeparatedListofEmails: records[0].arcsol__Comma_Separated_List_of_Emails__c,
                                DeleteAlreadyArchivedRecordsBatchSize: records[0].arcsol__DeleteAlreadyArchivedRecordsBatchSize__c,
                                Downformaintenance: records[0].arcsol__Down_for_maintenance__c,
                                EnableParentheticalCurrencyConversion: records[0].arcsol__Enable_Parenthetical_Currency_Conversion__c,
                                EnableServerSideEncryptionS3: records[0].arcsol__Enable_Server_Side_Encryption_S3__c,
                                FieldHistoryFileSize: records[0].arcsol__Field_History_File_Size__c,
                                GenericArchiveRelatedItemsBatchSize: records[0].arcsol__GenericArchiveAttachmentBatchSize__c,
                                GenericArchiveNotesBatchSize: records[0].arcsol__GenericArchiveNotesBatchSize__c,
                                GenericArchiveRelatedItemsBatchSize: records[0].arcsol__GenericArchiveRelatedItemsBatchSize__c,
                                GenericArchiveToRDSBatchSize: records[0].arcsol__GenericArchiveToRDSBatchSize__c,
                                ImplementationName: records[0].arcsol__ImplementationName__c,
                                MarkChildEligibityForDeleteBatchSize: records[0].arcsol__MarkChildEligibityForDeleteBatchSize__c,
                                MarkParentEligibityForDeleteBatchSize: records[0].arcsol__MarkParentEligibityForDeleteBatchSize__c,
                                MarkRecordsEligibleForDeleteBatchSize: records[0].arcsol__MarkRecordsEligibleForDeleteBatchSize__c,
                                MarkRelatedItemsCountOnParentSize: records[0].arcsol__MarkRelatedItemsCountOnParentSize__c,
                                ParentBatchSizeforAttachments: records[0].arcsol__Parent_Batch_Size_for_Attachments__c,
                                ParentBatchSizeforNotes: records[0].arcsol__Parent_Batch_Size_for_Notes__c,
                                VisibilityExportToCSV: records[0].arcsol__VisibilityExportToCSV__c,
                            }, {
                                where: {
                                    id: archivalSystemConfig.id
                                }
                            }).then(function () {
                                return res.json({
                                    success: true,
                                    data: {
                                        message: "sync done"
                                    }

                                });
                            });
                        return saveArchivalDetail(records, req, res);
                    }

                });
            }
        });
});

var saveArchivalDetail = function (req, res) {
    global.sfdc
        .sobject("arcsol__RDSConfig__c")
        .select('arcsol__ObjectName__c,arcsol__RDSFieldName__c,	arcsol__RDSTableName__c,arcsol__SFDCFieldName__c')
        //.where({ Name: "RDSConfig" })
        .execute(function (err, records) {
            console.log('daaa', records);
            if (err) {
                return res.json({
                    success: false,
                    message: err.toString(),
                    error: err,
                    err: err.toString()
                });
            }
            else if (records === undefined || records === null || records.length === 0) {
                return res.json({
                    success: false,
                    message: 'No such record found!'
                });
            }
            else {
                var sobjects = {};
                var sobjectData = [];
                records.forEach(function (record) {
                    if (sobjects[record.arcsol__ObjectName__c] === undefined) {
                        sobjects[record.arcsol__ObjectName__c] = {}
                        sobjects[record.arcsol__ObjectName__c]['Name'] = record.arcsol__RDSTableName__c;
                        sobjects[record.arcsol__ObjectName__c]['sobjectField'] = {};
                        sobjects[record.arcsol__ObjectName__c]['sobjectFieldData'] = [];
                        sobjectData.push(record.arcsol__ObjectName__c);
                    }

                    sobjects[record.arcsol__ObjectName__c].sobjectField[record.arcsol__SFDCFieldName__c] = record.arcsol__RDSFieldName__c;
                    sobjects[record.arcsol__ObjectName__c].sobjectFieldData.push(record.arcsol__SFDCFieldName__c)
                });
                console.log("sobjects", JSON.stringify(sobjects));
                var sdata = sobjectData.join("','");
                var referenceSObjects = db.SObject.findAll({
                    attributes: ['name', 'id'],
                    where: {
                        name: {
                            $in: sobjectData
                        }
                    }
                });
                console.log("sobjectData", sobjectData);
                referenceSObjects.then(function (refSObjects) {
                    console.log("refSObjects", refSObjects);
                    var _refSObjects = {};
                    refSObjects.forEach(function (refSObject) {
                        //ARCHIVAL SOBJECT
                        db.ArchivalSobject.findOrCreate({
                            where: {
                                SObjectId: refSObject.id
                            },
                            defaults: {
                                name: sobjects[refSObject.name].Name,
                                SObjectId: refSObject.id
                            }
                        }
                        ).spread(function (ArchivalSobject, created) {
                            console.log("ArchivalSobject", ArchivalSobject);
                            if (!created) {
                                db.ArchivalSobject.update({
                                    name: sobjects[refSObject.name].Name,
                                    SObjectId: ArchivalSobject.SObjectId
                                },
                                    {
                                        where: {
                                            SObjectId: ArchivalSobject.SObjectId
                                        }
                                    });
                            }
                            else {
                                db.SObjectLayout.build({ type: 'Archival', SObjectId: ArchivalSobject.SObjectId, ArchivalSobjectId: ArchivalSobject.id, created: true, active: false })
                                    .save();

                            }
                            //ARCHIVAL SOBJECT FIELD
                            db.SObjectField.findAll({
                                attributes: ['name', 'id', 'SObjectId'],
                                where: {
                                    name: {
                                        $in: sobjects[refSObject.name].sobjectFieldData
                                    },
                                    SObjectId: ArchivalSobject.SObjectId
                                }
                            }).then(function (sobjectfieldRec) {
                                console.log("sobjectfieldRec", sobjectfieldRec);
                                sobjectfieldRec.forEach(function (fields) {
                                    db.ArchivalSobjectField.findOrCreate({
                                        where: {
                                            ArchivalSobjectId: ArchivalSobject.id,
                                            SObjectFieldId: fields.id
                                        },
                                        defaults: {
                                            name: sobjects[refSObject.name].sobjectField[fields.name],
                                            ArchivalSobjectId: ArchivalSobject.id,
                                            SObjectFieldId: fields.id
                                        }
                                    }
                                    ).spread(function (ArchivalSobjectFields, created) {
                                        console.log("ArchivalSobjectFields", ArchivalSobjectFields);
                                        if (!created) {
                                            db.ArchivalSobjectField.update({
                                                name: sobjects[refSObject.name].sobjectField[fields.name],
                                                SObjectFieldId: ArchivalSobjectFields.SObjectFieldId
                                            },
                                                {
                                                    where: {
                                                        SObjectFieldId: ArchivalSobjectFields.SObjectFieldId,
                                                        ArchivalSobjectId: ArchivalSobjectFields.ArchivalSobjectId
                                                    }
                                                });
                                        }
                                    });
                                });


                            });
                        });
                    });


                });

            }
        });
}
archivalRouter.post('/checkArchivalActive', function (req, res) {
    var sObject = req.body;
    console.log("sObject", sObject);
    global.sfdc.describeSObject("arcsol__ArchivalSetupDetail__c", function (err, response) {
        if (err) {
            return res.json({
                success: false,
                message: "Error occured while loading sobjects from salesforce!",
                error: err
            });
        } else {
            return res.json({
                success: true,
                data: response
            });
        }
    });
});

// archivalRouter.post('/checkArchivalActive', function (req, res) {
//     var sObject = req.body;
//     console.log("sObject", sObject);
//     global.sfdc.describeSObject("arcsol__AWS_S3_RDS__c", function (err, response) {
//         if (err) {
//             return res.json({
//                 success: false,
//                 message: "Error occured while loading sobjects from salesforce!",
//                 error: err
//             });
//         } else {
//             return res.json({
//                 success: true,
//                 data: response
//             });
//         }
//     });
// });
archivalRouter.post('/list', function (req, res) {
    var criteria = (req.body) ? req.body.criteria : undefined;
    var where = (criteria) ? criteria.where : undefined;
    var SObjectLayouts = db.SObjectLayout.findAll({
        include: [{
            model: db.ArchivalSobject,
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        },
        {
            model: db.SObject,
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        }],
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        },
        where: (where) ? where : null,
        order: [
            ['id']
        ]
    });
    SObjectLayouts.then(function (sObjectLayouts) {
        console.log("SObjectLayouts:", sObjectLayouts);
        if (sObjectLayouts === undefined || sObjectLayouts === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading layouts for sObject.'
            });
        }
        return res.json({
            success: true,
            data: {
                layouts: sObjectLayouts
            }
        });

    });
});

archivalRouter.post('/sObjectList', function (req, res) {
    var layout = req.body;
    console.log("layout", layout);
    var ArchivalSobjectField = db.ArchivalSobjectField.findAll({
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        },
        where: {
            ArchivalSobjectId: layout.ArchivalSobjectId
        }
    });
    console.log("layout", layout);

    ArchivalSobjectField.then(function (archivalSobjectFields) {
        var sobjectDataField = [];
        archivalSobjectFields.forEach(function (field) {
            sobjectDataField.push(field.SObjectFieldId);
        });
        console.log("sobjectDataField", sobjectDataField);
        if (archivalSobjectFields === undefined || archivalSobjectFields === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading layouts for sObject.'
            });
        }
        var SObjectFields = db.SObjectField.findAll({
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            },
            where: {
                id: sobjectDataField
            }
        });
        SObjectFields.then(function (sObjectFields) {
            console.log("SObjectFields::", sObjectFields);
            if (sObjectFields === undefined || sObjectFields === null) {
                return res.json({
                    success: false,
                    message: 'Error occured while loading sobject fields.'
                });
            } else {
                var referenceSObjectNames = [];
                sObjectFields.forEach(function (field) {
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
                    console.log("referenceSObjects::", refSObjects);
                    var _refSObjects = {};
                    refSObjects.forEach(function (refSObject) {
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

});

archivalRouter.post('/fields', function (req, res) {
    var layout = req.body;
    console.log(layout);
    var SObjectLayoutFields = db.SObjectLayoutField.findAll({

        include: [{
            model: db.SObjectField,
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        }],
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        },
        where: {
            SObjectLayoutId: layout.id,
            type: {
                $in: ['Search-Criteria-Field', 'Search-Result-Field']
            }
        },
        order: [
            ['order']
        ]
    });

    SObjectLayoutFields.then(function (sObjectLayoutFields) {
        console.log("SObjectLayoutFields::", sObjectLayoutFields);
        if (sObjectLayoutFields === undefined || sObjectLayoutFields === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading layout fields.'
            });
        } else {
            return res.json({
                success: true,
                data: {
                    sObjectLayoutFields: sObjectLayoutFields
                }
            });
        }
    });
});


archivalRouter.post('/changeactive', function (req, res) {
    var sObjectLayout = req.body;
    db.SObjectLayout.update({
        active: sObjectLayout.active
    }, {
            where: {
                id: sObjectLayout.id
            }
        }).then(function () {
            global.config.archivalConfig.refreshConfig();
            return res.json({
                success: true
            });
        });
});


archivalRouter.post('/savelistlayout', function (req, res) {
    var listLayout = req.body;
    var fieldsToUpdate = [];
    var fieldsToCreate = [];
    var fieldsToProcess = listLayout.searchCriteriaFields.concat(listLayout.searchRecordFields);
    var sObjectLayoutId = "";
    fieldsToProcess.forEach(function (field, index) {
        if (sObjectLayoutId === "") {
            sObjectLayoutId = field.SObjectLayoutId;
        }
        if (field.id !== undefined) {
            fieldsToUpdate.push({
                id: field.id,
                label: (field.label) ? field.label : field.SObjectField.label,
                SObjectFieldId: field.SObjectField.id,
                type: field.type,
                hidden: field.hidden,
                order: field.order,
                deleted: field.deleted,
                reference: (field.SObjectField.type === 'reference') ? field.reference : null,
                SObjectLayoutId: field.SObjectLayoutId,
                ControllerSObjectFieldId: (field.ControllerSObjectFieldId) ? field.ControllerSObjectFieldId : null,
                fromfield: field.fromfield,
                tofield: field.tofield
            });
        } else if (field.id === undefined) {
            fieldsToCreate.push({
                label: (field.label) ? field.label : field.SObjectField.label,
                SObjectFieldId: field.SObjectField.id,
                type: field.type,
                hidden: field.hidden,
                deleted: false,
                order: field.order,
                reference: (field.SObjectField.type === 'reference') ? field.reference : null,
                SObjectLayoutId: field.SObjectLayoutId,
                ControllerSObjectFieldId: (field.ControllerSObjectFieldId) ? field.ControllerSObjectFieldId : null,
                fromfield: field.fromfield,
                tofield: field.tofield
            });
        }
    });

    db.SObjectLayoutField.bulkCreate(fieldsToCreate).then(function () {
        var rowsUpdated = 0;
        if (fieldsToUpdate.length >= 1) {
            fieldsToUpdate.forEach(function (field, index) {
                db.SObjectLayoutField.update(field, {
                    where: {
                        id: field.id
                    }
                }).then(function () {
                    rowsUpdated++;
                    if (fieldsToUpdate.length === (index + 1)) {
                        db.SObjectLayoutField.destroy({
                            where: {
                                deleted: true
                            }
                        }).then(function (affectedRows) {
                            db.SObjectLayout.update({
                                btnCriteria: listLayout.actionButtonCriteria,
                                whereClause: listLayout.sObjectLayoutWhereClause
                            }, {
                                    where: {
                                        id: sObjectLayoutId
                                    }
                                }).then(function () {
                                    return res.json({
                                        success: true,
                                        data: {
                                            rowsUpdated: rowsUpdated,
                                            rowsDeleted: affectedRows,
                                            rowsCreated: fieldsToCreate.length
                                        }
                                    });
                                });
                        });
                    }
                });
            });
        }
        else {
            db.SObjectLayout.update({
                btnCriteria: listLayout.actionButtonCriteria,
                whereClause: listLayout.sObjectLayoutWhereClause
            }, {
                    where: {
                        id: listLayout.sObjectLayoutId
                    }
                }).then(function () {
                    return res.json({
                        success: true,
                        data: {
                            rowsUpdated: rowsUpdated,
                            rowsCreated: fieldsToCreate.length
                        }
                    });
                });
        }
    });
});

archivalRouter.post('/saveeditlayout', function (req, res) {
    var editLayout = req.body;
    var fieldsToCreate = [], fieldsToUpdate = [];
    var sectionCreated = 0, sectionUpdated = 0;

    var createOrUpdateSection = function (section, callback) {
        if (section.id === undefined && section.deleted === false) {
            // CREATE SECTION
            global.db.SObjectLayoutSection
                .build({
                    title: section.title,
                    columns: section.isComponent ? 0 : section.columns.length,
                    order: section.order,
                    deleted: false,
                    readonly: (editLayout.type === 'Details') ? true : section.readonly,
                    active: section.active,
                    isComponent: section.isComponent,
                    SObjectLayoutId: section.SObjectLayoutId,
                    ComponentId: section.isComponent ? section.Component ? section.Component.id : null : null,
                    componentName: section.isComponent && section.Component.name ? section.Component.name : (section.isComponent && section.Component.catagory ? section.Component.catagory : null),
                    criteria: section.criteria ? section.criteria : undefined,
                    MobileEditLayoutConfigId: section.MobileEditLayoutConfigId ? section.MobileEditLayoutConfigId : null
                })
                .save()
                .then(function (newSection) {
                    sectionCreated++;
                    callback(newSection);
                });
        } else if (section.id !== undefined) {
            // UPDATE SECTION
            global.db.SObjectLayoutSection
                .update({
                    title: section.title,
                    columns: section.isComponent ? 0 : section.columns.length,
                    order: section.order,
                    deleted: section.deleted,
                    readonly: (editLayout.type === 'Details') ? true : section.readonly,
                    active: section.active,
                    isComponent: section.isComponent,
                    SObjectLayoutId: section.SObjectLayoutId,
                    ComponentId: section.isComponent ? section.Component ? section.Component.id : null : null,
                    componentName: section.isComponent && section.Component.name ? section.Component.name : (section.isComponent && section.Component.catagory ? section.Component.catagory : null),
                    criteria: section.criteria ? section.criteria : undefined,
                    MobileEditLayoutConfigId: section.MobileEditLayoutConfigId ? section.MobileEditLayoutConfigId : null
                }, {
                    where: {
                        id: section.id
                    }
                }).then(function () {
                    sectionUpdated++;
                    callback(section);
                });
        }
    };

    async.each(editLayout.layoutSections,
        function (section, callback) {
            createOrUpdateSection(section, function (updatedSection) {
                if (!section.isComponent) {
                    section.columns.forEach(function (fields, columnIndex) {
                        fields.forEach(function (field, fieldIndex) {
                            if (field.id === undefined && field.deleted === false) {
                                fieldsToCreate.push({
                                    label: (field.label) ? field.label : field.SObjectField.label,
                                    type: field.type,
                                    hidden: field.hidden,
                                    deleted: false,
                                    order: field.order,
                                    reference: (field.SObjectField.type === 'reference') ? (field.reference) ? field.reference : 'Name' : null,
                                    enable: (field.enable) ? true : false,
                                    column: field.column,
                                    readonly: (field.SObjectField.calculated || editLayout.type === 'Details') ? true : field.readonly,
                                    defaultValue: (field.defaultValue) ? field.defaultValue : null,
                                    active: field.active,
                                    SObjectFieldId: field.SObjectField.id,
                                    SObjectLayoutId: field.SObjectLayoutId,
                                    SObjectLayoutSectionId: updatedSection.id,
                                    SObjectLookupId: (field.SObjectLookupId) ? field.SObjectLookupId : null,
                                    ControllerSObjectFieldId: (field.ControllerSObjectFieldId) ? field.ControllerSObjectFieldId : null,
                                    event: (field.event) ? field.event : undefined,
                                    criteria: field.criteria ? field.criteria : undefined,
                                    requiredCriteria: field.requiredCriteria ? field.requiredCriteria : undefined,
                                    required: (editLayout.type === 'Details') ? false : field.required,
                                    currentUserSelected: (field.currentUserSelected) ? field.currentUserSelected : false,
                                    excludeCurrentUser: (field.excludeCurrentUser) ? field.excludeCurrentUser : false
                                });
                            } else {
                                fieldsToUpdate.push({
                                    id: field.id,
                                    label: (field.label) ? field.label : field.SObjectField.label,
                                    type: field.type,
                                    hidden: field.hidden,
                                    deleted: field.deleted,
                                    order: field.order,
                                    reference: (field.SObjectField.type === 'reference') ? (field.reference) ? field.reference : 'Name' : null,
                                    enable: (field.enable) ? true : false,
                                    column: field.column,
                                    readonly: (field.SObjectField.calculated || editLayout.type === 'Details') ? true : field.readonly,
                                    defaultValue: (field.defaultValue) ? field.defaultValue : null,
                                    active: field.active,
                                    SObjectFieldId: field.SObjectField.id,
                                    SObjectLayoutId: field.SObjectLayoutId,
                                    SObjectLayoutSectionId: updatedSection.id,
                                    SObjectLookupId: (field.SObjectLookupId) ? field.SObjectLookupId : null,
                                    ControllerSObjectFieldId: (field.ControllerSObjectFieldId) ? field.ControllerSObjectFieldId : null,
                                    event: (field.event) ? field.event : undefined,
                                    criteria: field.criteria ? field.criteria : undefined,
                                    requiredCriteria: field.requiredCriteria ? field.requiredCriteria : undefined,
                                    required: (editLayout.type === 'Details') ? false : field.required,
                                    currentUserSelected: (field.currentUserSelected) ? field.currentUserSelected : false,
                                    excludeCurrentUser: (field.excludeCurrentUser) ? field.excludeCurrentUser : false
                                });
                            }
                        });
                    });
                }
                callback();
            });
        },
        function (err) {
            if (err) {
                return res.json({
                    success: false,
                    error: err
                });
            }

            db.SObjectLayoutSection.destroy({
                where: {
                    deleted: true
                }
            }).then(function (sectionDeleted) {
                db.SObjectLayoutField.bulkCreate(fieldsToCreate).then(function () {
                    var fieldsUpdated = 0;
                    if (fieldsToUpdate.length >= 1) {
                        fieldsToUpdate.forEach(function (field, index) {
                            db.SObjectLayoutField.update(field, {
                                where: {
                                    id: field.id
                                },
                                individualHooks: true
                            }).then(function () {
                                fieldsUpdated++;
                                if (fieldsToUpdate.length === (index + 1)) {
                                    db.SObjectLayoutField.destroy({
                                        where: {
                                            deleted: true
                                        }
                                    }).then(function (fieldsDeleted) {
                                        return res.json({
                                            success: true,
                                            data: {
                                                fieldsUpdated: fieldsUpdated,
                                                fieldsDeleted: fieldsDeleted,
                                                fieldsCreated: fieldsToCreate.length,
                                                sectionCreated: sectionCreated,
                                                sectionUpdated: sectionUpdated,
                                                sectionDeleted: sectionDeleted
                                            }
                                        });
                                    });
                                }
                            });
                        });
                    }
                    else {
                        return res.json({
                            success: true,
                            data: {
                                fieldsUpdated: fieldsUpdated,
                                fieldsDeleted: fieldsUpdated,
                                fieldsCreated: fieldsToCreate.length,
                                sectionCreated: sectionCreated,
                                sectionUpdated: sectionUpdated,
                                sectionDeleted: sectionDeleted
                            }
                        });
                    }
                });
            });
        }
    );
});
archivalRouter.post('/saveeditlayoutrelatedlists', function (req, res) {
    var editLayout = req.body;
    var fieldsToCreate = [], fieldsToUpdate = [];
    var relatedListCreated = 0, relatedListUpdated = 0;
    var updatedRelatedListIds = [];

    var createOrUpdateRelatedList = function (relatedList, callback) {
        if (relatedList.id === undefined && relatedList.deleted === false) {
            // CREATE NEW RELATED LIST
            global.db.SObjectLayoutRelatedList
                .build({
                    title: relatedList.title,
                    order: relatedList.order,
                    deleted: false,
                    readonly: (editLayout.type === 'Details') ? true : relatedList.readonly,
                    active: relatedList.active,
                    SObjectLayoutId: relatedList.SObjectLayoutId,
                    SObjectId: relatedList.SObjectId,
                    SObjectFieldId: relatedList.SObjectFieldId,
                    dispaySection: relatedList.dispaySection,
                    criteria: relatedList.criteria ? relatedList.criteria : undefined,
                    whereClause: relatedList.whereClause,
                    groupBy: relatedList.groupBy,
                    orderBy: relatedList.orderBy,
                    requireAddMore: relatedList.requireAddMore,
                    MobileEditLayoutConfigId: editLayout.MobileEditLayoutConfigId
                })
                .save()
                .then(function (newRelatedList) {
                    relatedListCreated++;
                    callback(newRelatedList);
                });
        } else if (relatedList.id !== undefined) {
            // UPDATE RELATED LIST
            global.db.SObjectLayoutRelatedList
                .update({
                    title: relatedList.title,
                    order: relatedList.order,
                    deleted: relatedList.deleted,
                    readonly: (editLayout.type === 'Details') ? true : relatedList.readonly,
                    active: relatedList.active,
                    SObjectLayoutId: relatedList.SObjectLayoutId,
                    SObjectId: relatedList.SObjectId,
                    SObjectFieldId: relatedList.SObjectFieldId,
                    dispaySection: relatedList.dispaySection,
                    criteria: relatedList.criteria ? relatedList.criteria : undefined,
                    whereClause: relatedList.whereClause,
                    groupBy: relatedList.groupBy,
                    orderBy: relatedList.orderBy,
                    requireAddMore: relatedList.requireAddMore,
                    MobileEditLayoutConfigId: editLayout.MobileEditLayoutConfigId
                }, {
                    where: {
                        id: relatedList.id
                    }
                }).then(function () {
                    relatedListUpdated++;
                    callback(relatedList);
                });
        }
    };

    async.each(editLayout.relatedLists,
        function (relatedList, callback) {
            createOrUpdateRelatedList(relatedList, function (updatedRelatedList) {
                if (relatedList.deleted == false) {
                    relatedList.SObjectLayoutFields.forEach(function (field, fieldIndex) {
                        fieldsToCreate.push({
                            label: (field.label) ? field.label : field.SObjectField.label,
                            type: 'Related-List-Field',
                            hidden: false,
                            deleted: false,
                            order: field.order,
                            reference: (field.SObjectField.type === 'reference') ? (field.reference) ? field.reference : 'Name' : null,
                            enable: (field.enable) ? true : false,
                            readonly: (field.SObjectField.calculated || editLayout.type === 'Details') ? true : field.readonly,
                            required: field.required,
                            active: field.active,
                            SObjectFieldId: field.SObjectField.id,
                            SObjectLayoutId: relatedList.SObjectLayoutId,
                            SObjectLayoutRelatedListId: updatedRelatedList.id
                        });
                    });
                }
                updatedRelatedListIds.push(updatedRelatedList.id);
                callback();
            });
        }, function (err) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Error occured while saving layout related lists.',
                    error: err
                });
            }

            global.db.SObjectLayoutRelatedList.destroy({
                where: {
                    deleted: true
                }
            }).then(function (relatedListsDeleted) {
                global.db.SObjectLayoutField.destroy({
                    where: {
                        type: 'Related-List-Field',
                        SObjectLayoutRelatedListId: {
                            $in: updatedRelatedListIds
                        }
                    }
                }).then(function (relatedListFieldsDeleted) {
                    db.SObjectLayoutField.bulkCreate(fieldsToCreate).then(function () {
                        return res.json({
                            success: true,
                            data: {
                                relatedListUpdated: relatedListUpdated,
                                relatedListCreated: relatedListCreated,
                                relatedListDeleted: relatedListsDeleted,
                                relatedListFieldsDeleted: relatedListFieldsDeleted,
                                relatedListFieldsCreated: fieldsToCreate.length
                            }
                        });
                    });
                    global.sObjectFieldListConfig.refreshConfig();
                });
            });
        }
    );
});
module.exports = archivalRouter;