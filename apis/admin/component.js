var express = require('express');
var componentRouter = express.Router();
var csv = require('express-csv');
var request = require('request');
var path = require('path');
var fs = require('fs');

var getEnumForCatagoryValue = ()=>{
    var enumValue = [];
    console.log(db.Components.rawAttributes.catagory.values)
    db.Components.rawAttributes.catagory.values.forEach((value, index)=>{
        if(value.indexOf('Dashboard') > -1)
            enumValue.push(value);
    });
    return enumValue;
};

componentRouter.post('/list', function(req, res){
    var notIn = getEnumForCatagoryValue();
    var Components = db.Components.findAll({
        include: [{
            model: db.SObject,
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        }],
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: {
            catagory: {
                $notIn: notIn
            }
        },
        order: [
            ['id']
        ]
    });
    
    Components.then(function(Components) {
        if(Components === undefined || Components === null){
            return res.json({
                success: false,
                message: 'Error occured while loading components.'
            });
        }else{
            return res.json({
                success: true,
                data: {
                    components: Components
                }
            });
        }
    });
});

componentRouter.post('/getcomponentsforsobject', function(req, res){
    var sObject = req.body;
    var components = db.Components.findAll({
        include: [{
            model: db.SObject,
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        },{
            model: db.ComponentDetail,
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        }
        ],
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: {
            SObjectId: sObject.id,
            active: true
        }
    });
    components.then(function(components) {
        if(components === undefined || components === null){
            return res.json({
                success: false,
                message: 'Error occured while loading child sobjects.'
            });
        }else{
            return res.json({
                success: true,
                data: {
                    components: components
                    // sObjectFields: sObjectFields
                }
            });
        }
    });
});

componentRouter.post('/delete', function(req, res){
    var component = req.body;
    global.db.Components.destroy({
        where: {
            id: component.id
        }
    }).then(function(deletedCount){
        if(deletedCount === 0){
            return res.json({
                success: false,
                message: 'Error occured while deleting component.'
            });
        }else{
            return res.json({
                success: true,
                data: {
                    deletedCount: deletedCount
                }
            });
        }
    });
});

componentRouter.post('/details', function(req, res){
    var component = req.body;
    var loadComponentDetails = db.Components.findOne({
        include: [{
            model: db.SObject,
            attributes: {
                exclude: ['createdAt','updatedAt']
            },
            include: {
                model: db.SObjectField,
                attributes: {
                    exclude: ['createdAt','updatedAt']
                }
            }
        },{
            model: db.ComponentDetail,
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        }],
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: {
            id: component.id
        }
    });
    
    loadComponentDetails.then(function(component) {
        if(component === undefined || component === null){
            return res.json({
                success: false,
                message: 'Error occured while loading component details.'
            });
        }else{
            return res.json({
                success: true,
                data: {
                    component: component,
                }
            });
        }
    });
});

componentRouter.post('/save', function(req, res){
    var componentModel = req.body;
    var fieldsToCreate = [];
    console.log(componentModel);
    
    var createOrUpdateComponent = function(component, callback){
        if(component.id === undefined || component.id === null){
            // CREATE
            global.db.Components
                .build({
                    title: component.title,
                    desc: component.desc,
                    active: component.active,
                    catagory: component.catagory,
                    sobjectname: component.sobjectname,
                    SObjectId: component.SObjectId,
                })
                .save()
                .then(function(newComponent){
                    global.db.ComponentDetail.build({configuration: component.ComponentDetails[0].configuration,ComponentId: newComponent.id}).save();
                    callback(newComponent);
                });
        }else{
            // UPDATE
            global.db.Components
                .update({
                    title: component.title,
                    desc: component.desc,
                    active: component.active,
                    SObjectId: component.SObjectId
                },{
                    where: {
                        id: component.id
                    }
                }).then(function(){
                    global.db.ComponentDetail.update({
                        configuration: component.ComponentDetails[0].configuration
                    },{
                        where:{
                           id: component.ComponentDetails[0].id
                        }
                    });
                    callback(component);
                });
        }
    };
    
    async.each([componentModel], function(componentModel, asyncCallBack){
        createOrUpdateComponent(componentModel, function(component){
            asyncCallBack();
        });     
    }, function(err){
        if(err){
            return res.json({
                success: false,
                error: err
            });
        }
        
        return res.json({
            success: true,
            data: {
                fieldsUpdated: fieldsToCreate.length
            }
        });
    });
});

componentRouter.post('/static/getcomponentsforsobject', function(req, res){
    var sObject = req.body;
    var componentList = [];
    staticcomponentconfig.list.forEach(function (component) {
        componentObj=JSON.parse(component.config);
        if (componentObj.parent.name == sObject.name && componentObj.active) {
            componentList.push(componentObj);
        }
    });
    if (componentList.length === 0) {
        return res.json({
            success: true,
            data: {
                components: componentList
            }
        });
    }
    else {
        return res.json({
            success: true,
            data: {
                components: componentList
            }
        });
    }
});

componentRouter.post('/static/list', function(req, res){
    
    var componentDir = path.join(__dirname, '/../../static-components/');
    var componentList = [];
    var fileList = ['change-request-component-', 'cost-allocation-component-', 'other-charge-component-'];
    
    fileList.forEach(function (file) {
        staticcomponentconfig.list.forEach(function (component) {
            if ((component.name+"-") == file) {
                componentList.push(JSON.parse(component.config));
            }
        });
    });
    
    if (fileList.length === componentList.length) {
        return res.json({
            success: true,
            data: {
                components: componentList.sort()
            }
        });
    }
    else{
        fileList.forEach(function (file) {
            var cnt = 0;
            staticcomponentconfig.list.forEach(function (component) {
                if ((component.name+"-") == file) {
                    cnt = 1;
                }
            });
            if (cnt == 0) {
                var filePath = componentDir + file + 'meta.json';
                fs.readFile(filePath, 'utf8', function (err, data) {
                    if (err) {
                        return res.json({
                            success: false,
                            message: 'Error occured while loading components.'
                        });
                    }
                    console.log(data);
                    componentList.push(JSON.parse(data));
                    if (fileList.length === componentList.length) {
                        return res.json({
                            success: true,
                            data: {
                                components: componentList.sort()
                            }
                        });
                    }
                });
            }
        });
    }
});

componentRouter.post('/static/save', function(req, res){
    var fileName = req.body.name.toLowerCase().replace(/\s/g, "-") ;
    // var componentDir = path.join(__dirname,'/../../static-components/');
    var cnt = 0;
    staticcomponentconfig.list.forEach(function (component) {
        if (component.name == fileName) {
            cnt = 1;
        }
    });
    if (cnt == 0) {
        global.db.StaticComponent.create({
            name: fileName,
            config: JSON.stringify(req.body)
        }).then(function (component) {
            staticcomponentconfig.refreshStaticComponentConfig();
            return res.json({
                success: true,

            });
        }).catch(function (err) {
      
            return res.json({
                success: false,
                message: 'Error occured while saving component configuration.'
            });
        });
    }
    else {
         global.db.StaticComponent.update({
            name: fileName,
            config: JSON.stringify(req.body)
        }, {
            where: {
                    name: fileName
            }
        }).then(function (component) {
            staticcomponentconfig.refreshStaticComponentConfig();
            return res.json({
                success: true,
            });
        }).catch(function (err) {
            console.log(err);
            return res.json({
                success: false,
                message: 'Error occured while saving component configuration.'
            });
        });
    }

    
});

componentRouter.post('/dashboard/list', function(req, res){
    var inClause = getEnumForCatagoryValue(); 
    var where = {catagory: {$in: inClause}}
    for(keys in req.body){
        where[keys] = req.body[keys];
    }
    var Components = db.Components.findAll({
        include: [{
            model: db.SObject,
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        }],
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: where,
        order: [
            ['id','ASC'],
            ['catagory','ASC']
        ]
    });
    
    Components.then(function(Components) {
        if(Components === undefined || Components === null){
            return res.json({
                success: false,
                message: 'Error occured while loading components.'
            });
        }else{
            return res.json({
                success: true,
                data: {
                    components: Components
                }
            });
        }
    });
});

module.exports = componentRouter;