var express = require('express');
var clientDashboardRouter = express.Router();

clientDashboardRouter.post('/contents', function(req, res){
    
    var DashboarContainer = db.DashboarContainer.findAll({
        include: [{
            model: db.DashboardContainersComponents,
            attributes: {
                    exclude: ['createdAt','updatedAt']
            },
            include:[{
                model: db.Components,
                attributes: {
                    exclude: ['createdAt','updatedAt']
                }
            }]
        }],
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        order: [
            ['order'],
            [db.DashboardContainersComponents, 'order']
        ]
    });

    DashboarContainer.then(function(dashboarContainers) {
        if(dashboarContainers === undefined || dashboarContainers === null){
            return res.json({
                success: false,
                message: 'Error occured while loading dashboard contents.'
            });
        }else{
            var containers = JSON.parse(JSON.stringify(dashboarContainers));
            containers.forEach(function(container){
                 container.components = [];
                container.DashboardContainersComponents.forEach(function(containersComponent){
                    containersComponent.title = containersComponent.Component.title;
                    containersComponent.catagory = containersComponent.Component.catagory;
                    delete containersComponent.Component;
                    container.components.push(containersComponent);
                });
                delete container.DashboardContainersComponents;
            });
            return res.json({
                success: true,
                data: {
                    containers: containers
                }
            });
        }
    });
    
});

clientDashboardRouter.post('/save', function(req, res){
    var containers = req.body.containers;
    var componentsToCreate = [], componentsToUpdate = [];
    var containerCreated = 0, containerUpdated = 0;
    
    var createOrUpdateContainer = function(container,callback){
        if(container.id === undefined && container.deleted === false){
            // CREATE CONTAINER
            global.db.DashboarContainer
                .build({
                    title: container.title,
                    label: container.label,
                    order: container.order,
                    allowedType: container.allowedType,
                    deleted: false,
                    active: container.active,
                })
                .save()
                .then((newContainer)=>{
                    containerCreated++;
                    callback(newContainer);
                });
        }else if(container.id !== undefined){
            // UPDATE CONTAINER
            global.db.DashboarContainer
                .update({
                    title: container.title,
                    label: container.label,
                    order: container.order,
                    allowedType: container.allowedType,
                    deleted: container.deleted,
                    active: container.active,
                },{
                    where: {
                        id: container.id
                    }
                }).then(function(){
                    containerUpdated++;
                    callback(container);
                });
        }
    };
    
    async.each(containers,
        function(container,callback){
            createOrUpdateContainer(container,function(updatedContainer){
                container.components.forEach(function(component,columnIndex){
                    if(component.id === undefined && component.deleted === false){
                        componentsToCreate.push({
                            label: component.label,
                            deleted: component.deleted,
                            order: component.order,
                            columns: component.columns,
                            active: component.active,
                            DashboarContainerId: updatedContainer.id,
                            ComponentId:  component.component.id
                        });
                    }else{
                        componentsToUpdate.push({
                            id: component.id,
                            label: component.label,
                            deleted: component.deleted,
                            order: component.order,
                            columns: component.columns,
                            active: component.active,
                            DashboarContainerId: updatedContainer.id,
                            ComponentId: component.ComponentId
                        });
                    }
                });
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
            
            db.DashboarContainer.destroy({
                where: {
                    deleted: true
                }
            }).then(function(containerDeleted){
                db.DashboardContainersComponents.bulkCreate(componentsToCreate).then(function(){
                    var componentsUpdated = 0;
                    if(componentsToUpdate.length >= 1){
                        componentsToUpdate.forEach(function (component,index) {
                            db.DashboardContainersComponents.update(component,{
                                where: {
                                    id: component.id
                                },
                                individualHooks: true
                            }).then(function(){
                                componentsUpdated++;
                                if(componentsToUpdate.length === (index+1)){
                                    db.DashboardContainersComponents.destroy({
                                        where: {
                                            deleted: true
                                        }
                                    }).then(function(componentsDeleted){
                                        return res.json({
                                            success: true,
                                            data: {
                                                componentsUpdated: componentsUpdated,
                                                componentsDeleted: componentsDeleted,
                                                componentsCreated: componentsToCreate.length,
                                                containerCreated: containerCreated,
                                                containerUpdated: containerUpdated,
                                                containerDeleted: containerDeleted
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
                                componentsUpdated: componentsUpdated,
                                componentsDeleted: componentsUpdated,
                                componentsCreated: componentsToCreate.length,
                                containerCreated: containerCreated,
                                containerUpdated: containerUpdated,
                                containerDeleted: containerDeleted
                            }
                        });
                    }
                });
            });
        }
    );
});

module.exports = clientDashboardRouter;