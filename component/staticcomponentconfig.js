staticcomponentconfig ={};
staticcomponentconfig.list=[];
staticcomponentconfig.refreshStaticComponentConfig = function(utilityname,dataObject,callback){
   staticcomponentconfig.list=[];
   var findAllStaticComponent = global.db.StaticComponent.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: null 
    });

    findAllStaticComponent.then(function(components){
        components.forEach(function(component){
            staticcomponentconfig.list.push(component);
        });
        
    });
}
staticcomponentconfig.refreshStaticComponentConfig();
module.exports = staticcomponentconfig;