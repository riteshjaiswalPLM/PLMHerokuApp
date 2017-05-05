var express = require('express');
var dashboardRouter = express.Router();

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
            selectFields.push(field.SObjectField.name)
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

module.exports = dashboardRouter;