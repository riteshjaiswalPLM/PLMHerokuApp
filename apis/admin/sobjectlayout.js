var express = require('express');
var layoutRouter = express.Router();
var path = require('path');
var fs = require('fs');

layoutRouter.post('/list', function(req, res){
    var criteria = (req.body) ? req.body.criteria : undefined;
    var where = (criteria) ? criteria.where : undefined;
    var UserMapping = db.UserMapping.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        order: [
            ['id']
        ]
    });
    UserMapping.then(function(userMapping){
        // where.SObjectId = {$ne:userMapping[0].SObjectId};
        // where.type = {$ne:'Edit'};
        var SObjectLayouts = db.SObjectLayout.findAll({
            include: [{
                model: db.SObject,
                attributes: {
                    exclude: ['createdAt','updatedAt']
                }
            }],
            attributes: {
                exclude: ['createdAt','updatedAt']
            },
            where: (where) ? where : null,
            order: [
                ['id']
            ]
        });
        SObjectLayouts.then(function(sObjectLayouts) {
            if(sObjectLayouts === undefined || sObjectLayouts === null){
                return res.json({
                    success: false,
                    message: 'Error occured while loading layouts for sObject.'
                });
            }else{
                sObjectLayouts.forEach(function(sObjectLayout, index){
                    if(sObjectLayout.SObjectId === userMapping[0].SObjectId && sObjectLayout.type === 'Edit') sObjectLayouts.splice(index, 1);
                    if(sObjectLayout.SObjectId === userMapping[0].SObjectId && sObjectLayout.type === 'Create') sObjectLayouts.splice(index, 1);
                });
                return res.json({
                    success: true,
                    data: {
                        layouts: sObjectLayouts
                    }
                });
            }
        });
    });
});

layoutRouter.post('/fields', function(req, res){
    var layout = req.body;
    console.log(layout);
    var SObjectLayoutFields = db.SObjectLayoutField.findAll({
        include: [{
            model: db.SObjectField,
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        }],
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: {
            SObjectLayoutId: layout.id,
            type: {
                $in: ['Search-Criteria-Field','Search-Result-Field']
            }
        },
        order: [
            ['order']
        ]
    });
    
    SObjectLayoutFields.then(function(sObjectLayoutFields) {
        if(sObjectLayoutFields === undefined || sObjectLayoutFields === null){
            return res.json({
                success: false,
                message: 'Error occured while loading layout fields.'
            });
        }else{
            return res.json({
                success: true,
                data: {
                    sObjectLayoutFields: sObjectLayoutFields
                }
            });
        }
    });
});

layoutRouter.post('/contents', function(req, res){
    var layout = req.body, whereClause;
    whereClause = {
        SObjectLayoutId: layout.id
    };
    if(layout.type === 'Mobile'){
        whereClause.MobileEditLayoutConfigId = layout.MobileEditLayoutConfigId;
    }
    var SObjectLayoutSections = db.SObjectLayoutSection.findAll({
        include: [{
            model: db.SObjectLayoutField,
            include:[{
                model: db.SObjectField,
                attributes: {
                    exclude: ['createdAt','updatedAt']
                }
            },{
                model: db.SObjectField,
                as: 'ControllerSObjectField',
                attributes: {
                    exclude: ['createdAt','updatedAt']
                }
            },{
                model: db.SObjectLookup,
                attributes: {
                    exclude: ['createdAt','updatedAt']
                }
            }],
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        },{
            model: db.Components,
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        }],
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: whereClause,
        order: [
            ['order'],
            [db.SObjectLayoutField, 'order']
        ]
    });
    
    SObjectLayoutSections.then(function(sObjectLayoutSections) {
        if(sObjectLayoutSections === undefined || sObjectLayoutSections === null){
            return res.json({
                success: false,
                message: 'Error occured while loading layout contents.'
            });
        }else{
            var layoutSections = JSON.parse(JSON.stringify(sObjectLayoutSections));
            layoutSections.forEach(function(section){
                section.columns = (section.columns === 1) ? [[]] : [[],[]] ;
                section.SObjectLayoutFields.forEach(function(field){
                    section.columns[field.column-1].push(field);
                });
                delete section.SObjectLayoutFields;
                if(section.isComponent && section.Component === null && section.ComponentId === null){
                    var fileName=section.componentName.toLowerCase().replace(/\s/g,"-");
                    staticcomponentconfig.list.forEach(function (component) {
                        if (component.name == fileName) {
                            section.Component = JSON.parse(component.config);
                        }
                    });
                   
                }
            });
            return res.json({
                success: true,
                data: {
                    sObjectLayoutSections: layoutSections
                }
            });
        }
    });
});

layoutRouter.post('/relatedlists', function(req, res){
    var layout = req.body;
    var where = {}, secondryWhere = {};
    if(layout.type === 'Mobile'){
        where.forMobile = true;
        secondryWhere.MobileEditLayoutConfigId = layout.MobileEditLayoutConfigId;
    }
    else{
        secondryWhere.SObjectLayoutId = layout.id;
    }
    console.log(layout);
    var SObjectLayoutRelatedLists = db.SObjectLayoutRelatedList.findAll({
        include: [{
            model: db.SObjectLayoutField,
            include: {
                model: db.SObjectField,
                attributes: {
                    exclude: ['createdAt','updatedAt']
                },
                where: where
            },
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        },{
            model: db.SObject,
            include: {
                model: db.SObjectField,
                attributes: {
                    exclude: ['createdAt','updatedAt']
                },
                where: where
            },
            attributes: {
                exclude: ['createdAt','updatedAt']
            },
            where: where
        },{
            model: db.SObjectField,
            attributes: {
                exclude: ['createdAt','updatedAt']
            },
            where: where
        }],
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: secondryWhere,
        order: [
            ['order'],
            [db.SObjectLayoutField, 'order']
        ]
    });
    
    SObjectLayoutRelatedLists.then(function(sObjectLayoutRelatedLists) {
        if(sObjectLayoutRelatedLists === undefined || sObjectLayoutRelatedLists === null){
            return res.json({
                success: false,
                message: 'Error occured while loading layout related lists.'
            });
        }else{
            return res.json({
                success: true,
                data: {
                    sObjectLayoutRelatedLists: sObjectLayoutRelatedLists
                }
            });
        }
    });
});

layoutRouter.post('/create', function(req, res){
    var layoutToCreate = req.body;
    if(layoutToCreate === null || layoutToCreate === undefined){
        return res.json({
            success: false,
            message: 'No data found for layout.'
        });
    } else {
        // UPDATE EXISTING LAYOUT
        db.SObjectLayout.update({
            created: true
        },{
            where: {
                id: layoutToCreate.id
            }
        }).then(function(){
            return res.json({
                success: true
            });
        });
    }
});

layoutRouter.post('/markasdefault', function(req, res){
    var layout = req.body;
    if(layout === null || layout === undefined){
        return res.json({
            success: false,
            message: 'No data found for layout.'
        });
    } else {
        db.SObjectLayout.update({
            default: false
        },{
            where: {
                SObjectId: layout.SObjectId
            }
        }).then(function(){
            // UPDATE EXISTING LAYOUT
            db.SObjectLayout.update({
                default: layout.default,
                active: true
            },{
                where: {
                    id: layout.id
                }
            }).then(function(){
                // ASSIGN DEFAULT LAYOUT IN TABS
                db.Tab.update({
                    SObjectLayoutId: layout.id
                },{
                    where: {
                        SObjectId: layout.SObjectId
                    }
                }).then(function(){
                    // Return response
                    return res.json({
                        success: true
                    });
                });
            });       
        });
    }
});

layoutRouter.post('/delete', function(req, res){
    var sObjectLayout = req.body;
    db.SObjectLayout.update({
        active: false,
        created: false,
        default: false
    },{
        where: {
            id: sObjectLayout.id
        }
    }).then(function(){
        db.SObjectLayoutSection.destroy({
            where: {
                SObjectLayoutId: sObjectLayout.id
            },
            individualHooks : true
        }).then(function(deletedSectionsCount){
            db.SObjectLayoutField.destroy({
                where: {
                    SObjectLayoutId: sObjectLayout.id
                }
            }).then(function(deletedFieldsCount){
                return res.json({
                    success: true
                });         
            });
        });
    });
});

layoutRouter.post('/changeactive', function(req, res){
    var sObjectLayout = req.body;
    db.SObjectLayout.update({
        active: sObjectLayout.active
    },{
        where: {
            id: sObjectLayout.id
        }
    }).then(function(){
        return res.json({
            success: true
        });
    });
});

layoutRouter.post('/savelistlayout', function(req, res){
    var listLayout = req.body;
    var fieldsToUpdate = [];
    var fieldsToCreate = [];
    var fieldsToProcess = listLayout.searchCriteriaFields.concat(listLayout.searchRecordFields); 
    var sObjectLayoutId ="";
    fieldsToProcess.forEach(function(field,index){
        if(sObjectLayoutId===""){
            sObjectLayoutId=field.SObjectLayoutId;
        }
        if (field.id !== undefined){
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
        } else if(field.id === undefined) {
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
    
    db.SObjectLayoutField.bulkCreate(fieldsToCreate).then(function(){
        var rowsUpdated = 0;
        if(fieldsToUpdate.length >= 1){
            fieldsToUpdate.forEach(function (field,index) {
                db.SObjectLayoutField.update(field,{
                    where: {
                        id: field.id
                    }
                }).then(function(){
                    rowsUpdated++;
                    if(fieldsToUpdate.length === (index+1)){
                        db.SObjectLayoutField.destroy({
                            where: {
                                deleted: true
                            }
                        }).then(function(affectedRows){
                            db.SObjectLayout.update({
                                btnCriteria : listLayout.actionButtonCriteria,
                                whereClause : listLayout.sObjectLayoutWhereClause
                            },{
                                where: {
                                    id: sObjectLayoutId
                                }
                            }).then(function(){
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
        else{
            db.SObjectLayout.update({
                btnCriteria : listLayout.actionButtonCriteria,
                whereClause : listLayout.sObjectLayoutWhereClause
            },{
                where: {
                    id: listLayout.sObjectLayoutId
                }
            }).then(function(){
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

layoutRouter.post('/saveeditlayout', function(req, res){
    var editLayout = req.body;
    var fieldsToCreate = [], fieldsToUpdate = [];
    var sectionCreated = 0, sectionUpdated = 0;
    
    var createOrUpdateSection = function(section,callback){
        if(section.id === undefined && section.deleted === false){
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
                .then(function(newSection){
                    sectionCreated++;
                    callback(newSection);
                });
        }else if(section.id !== undefined){
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
                },{
                    where: {
                        id: section.id
                    }
                }).then(function(){
                    sectionUpdated++;
                    callback(section);
                });
        }
    };
    
    async.each(editLayout.layoutSections,
        function(section,callback){
            createOrUpdateSection(section,function(updatedSection){
                if(!section.isComponent){
                    section.columns.forEach(function(fields,columnIndex){
                        fields.forEach(function(field,fieldIndex){
                            if(field.id === undefined && field.deleted === false){
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
                                    currentUserSelected: (field.currentUserSelected)?field.currentUserSelected:false,
                                    excludeCurrentUser: (field.excludeCurrentUser)?field.excludeCurrentUser:false
                                });
                            }else{
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
                                    currentUserSelected: (field.currentUserSelected)?field.currentUserSelected:false,
                                    excludeCurrentUser: (field.excludeCurrentUser)?field.excludeCurrentUser:false
                                });
                            }
                        });
                    });
                }
                callback();
            });
        },
        function(err){
            if(err){
                return res.json({
                    success: false,
                    error: err
                });
            }
            
            db.SObjectLayoutSection.destroy({
                where: {
                    deleted: true
                }
            }).then(function(sectionDeleted){
                db.SObjectLayoutField.bulkCreate(fieldsToCreate).then(function(){
                    var fieldsUpdated = 0;
                    if(fieldsToUpdate.length >= 1){
                        fieldsToUpdate.forEach(function (field,index) {
                            db.SObjectLayoutField.update(field,{
                                where: {
                                    id: field.id
                                },
                                individualHooks: true
                            }).then(function(){
                                fieldsUpdated++;
                                if(fieldsToUpdate.length === (index+1)){
                                    db.SObjectLayoutField.destroy({
                                        where: {
                                            deleted: true
                                        }
                                    }).then(function(fieldsDeleted){
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
                    else{
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

layoutRouter.post('/saveeditlayoutrelatedlists', function(req, res){
    var editLayout = req.body;
    var fieldsToCreate = [], fieldsToUpdate = [];
    var relatedListCreated = 0, relatedListUpdated = 0;
    var updatedRelatedListIds = [];
    
    var createOrUpdateRelatedList = function(relatedList,callback){
        if(relatedList.id === undefined && relatedList.deleted === false){
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
                    dispaySection : relatedList.dispaySection,
                    criteria: relatedList.criteria ? relatedList.criteria : undefined,
                    requireAddMore: relatedList.requireAddMore,
                    MobileEditLayoutConfigId: editLayout.MobileEditLayoutConfigId
                })
                .save()
                .then(function(newRelatedList){
                    relatedListCreated++;
                    callback(newRelatedList);
                });
        }else if(relatedList.id !== undefined){
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
                    dispaySection:relatedList.dispaySection,
                    criteria: relatedList.criteria ? relatedList.criteria : undefined,
                    requireAddMore: relatedList.requireAddMore,
                    MobileEditLayoutConfigId: editLayout.MobileEditLayoutConfigId
                },{
                    where: {
                        id: relatedList.id
                    }
                }).then(function(){
                    relatedListUpdated++;
                    callback(relatedList);
                });
        }
    };
    
    async.each(editLayout.relatedLists, 
        function(relatedList, callback){
            createOrUpdateRelatedList(relatedList, function(updatedRelatedList){
                if(relatedList.deleted==false){
                    relatedList.SObjectLayoutFields.forEach(function(field, fieldIndex){
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
                            SObjectLayoutId: field.SObjectLayoutId,
                            SObjectLayoutRelatedListId: updatedRelatedList.id
                        });
                    });
                }                
                updatedRelatedListIds.push(updatedRelatedList.id);
                callback();
            });
        }, function(err){
            if(err){
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
            }).then(function(relatedListsDeleted){
                global.db.SObjectLayoutField.destroy({
                    where: {
                        type: 'Related-List-Field',
                        SObjectLayoutRelatedListId: {
                            $in: updatedRelatedListIds
                        }
                    }
                }).then(function(relatedListFieldsDeleted){
                    db.SObjectLayoutField.bulkCreate(fieldsToCreate).then(function(){
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

layoutRouter.post('/getuserprofilelayout', function(req, res){
    var ltype="Edit";
    if(req.body !=undefined && req.body.type !=undefined){
        ltype=req.body.type;
    }
    var where = {};
    var UserMapping = db.UserMapping.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        order: [
            ['id']
        ]
    });
    UserMapping.then(function(userMapping){
        if(userMapping && userMapping.length > 0){
            where.SObjectId = userMapping[0].SObjectId;
            where.type = ltype;
            var SObjectLayout = db.SObjectLayout.findAll({
                include: [{
                    model: db.SObject,
                    attributes: {
                        exclude: ['createdAt','updatedAt']
                    }
                }],
                attributes: {
                    exclude: ['createdAt','updatedAt']
                },
                where: (where) ? where : null,
                order: [
                    ['id']
                ]
            });
            SObjectLayout.then(function(sObjectLayout) {
                if(sObjectLayout === undefined || sObjectLayout === null || (sObjectLayout !== undefined && sObjectLayout.length === 0) || (sObjectLayout !== null && sObjectLayout.length === 0)){
                    return res.json({
                        success: false,
                        message: 'Please configure user mapping properly.'
                    });
                }else{
                    return res.json({
                        success: true,
                        data: {
                            layouts: sObjectLayout[0]
                        }
                    });
                }
            });
        }
        else{
            return res.json({
                success: false,
                message: 'Please configure user mapping first.'
            });
        }
    });
});

layoutRouter.post('/loadgoverningfields', (req, res)=>{
    var whereClause = {
        forMobile : true,
        isGovernField : true,
        
    }
    if(req.body.SObject) whereClause.SObjectId = req.body.SObject.id;
    db.SObjectField.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        include:{
            model: db.SObject,
            attributes:{
                include: ['name']
            }
        },
        where: whereClause,
    })
    .then((governingFields)=>{
        if(governingFields === undefined || governingFields === null){
            return res.json({
                success: false,
                message: 'Please try again letter.\nSomething went wrong while fetching governing fields.'
            });
        }
        return res.json({
            success: true,
            data: {
                governingFields: governingFields
            }
        });
    })
    .catch(()=>{
        return res.json({
            success: false,
            message: 'Please try again letter.\nSomething went wrong while fetching governing fields.'
        });
    });
});

layoutRouter.post('/loadmobileeditlayoutconfig', (req, res)=>{
    var whereClause = {
        SObjectLayoutId : req.body.id
    }
    db.MobileEditLayoutConfig.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: whereClause,
    })
    .then((mobileEditLayoutConfigs)=>{
        if(mobileEditLayoutConfigs === undefined || mobileEditLayoutConfigs === null){
            return res.json({
                success: false,
                message: 'Please try again letter.\nSomething went wrong while fetching governing fields.'
            });
        }
        return res.json({
            success: true,
            data: {
                mobileEditLayoutConfigs: mobileEditLayoutConfigs
            }
        });
    })
    .catch(()=>{
        return res.json({
            success: false,
            message: 'Please try again letter.\nSomething went wrong while fetching governing fields.'
        });
    });
});

layoutRouter.post('/changemobileeditlayoutconfigactive', (req, res)=>{
    db.MobileEditLayoutConfig.update({
        active: req.body.active
    },{
        where: {
            id: req.body.id
        }
    }).then(()=>{
        return res.json({
            success: true
        });
    });
});

layoutRouter.post('/deletemobileeditlayoutconfig', (req, res)=>{
    var mobileEditLayoutConfig = req.body;
    db.MobileEditLayoutConfig.destroy({
        where: {
            id: mobileEditLayoutConfig.id
        },
    }).then((affectedRows)=>{
        return res.json({
            success: true,
            data: {
                affectedRows: affectedRows
            }
        });
    })
    .catch((error)=>{
        return res.json({
            success: false,
            message: 'Error occured while deleting mobile layout configuration.',
            error: error
        });
    });
});

layoutRouter.post('/savemobileeditlayoutconfig', (req, res)=>{
    var mobileEditLayoutConfig = req.body;
    db.MobileEditLayoutConfig.findAll({where: {governingFieldValue : JSON.stringify(mobileEditLayoutConfig.governingFieldValue)}})
        .then((mobileEditLayoutConfiguration)=>{
            if(mobileEditLayoutConfiguration !== undefined && mobileEditLayoutConfiguration !== undefined && mobileEditLayoutConfiguration.length > 0){
                return res.json({
                    success: false,
                    message: 'Mobile layout configuration for combination is already exist.',
                });    
            }
            if(mobileEditLayoutConfig.id){
                db.MobileEditLayoutConfig.update({
                    governingFieldValue: mobileEditLayoutConfig.governingFieldValue
                },{
                    where: {
                        id: mobileEditLayoutConfig.id
                    }
                })
                .then((newMobileEditLayoutConfig)=>{
                    return res.json({
                        success: true,
                        data: {
                            newMobileEditLayoutConfig: newMobileEditLayoutConfig
                        }
                    });
                })
                .catch((error)=>{
                    return res.json({
                        success: false,
                        message: 'Error occured while creating mobile layout configuration.',
                        error: error
                    });
                });
            }
            else{
                db.MobileEditLayoutConfig.create(mobileEditLayoutConfig)
                    .then((newMobileEditLayoutConfig)=>{
                        return res.json({
                            success: true,
                            data: {
                                newMobileEditLayoutConfig: newMobileEditLayoutConfig
                            }
                        });
                    })
                    .catch((error)=>{
                        return res.json({
                            success: false,
                            message: 'Error occured while creating mobile layout configuration.',
                            error: error
                        });
                    });
            }
        })
        .catch((error)=>{
            return res.json({
                success: false,
                message: 'Error occured while creating mobile layout configuration.',
                error: error
            });
        });
});

module.exports = layoutRouter;