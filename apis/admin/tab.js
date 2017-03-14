var express = require('express');
var tabRouter = express.Router();

tabRouter.post('/list', function(req, res){
    var criteria = (req.body) ? req.body.criteria : undefined;
    var where = (criteria) ? criteria.where : undefined;
    var Tabs = db.Tab.findAll({
        include: [{
            model: db.SObject,
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        },{
            model: db.Icon,
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        }],
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        order: [
            ['order']
        ],
        where: (where) ? where : null
    });
    
    Tabs.then(function(tabs) {
        if(tabs === undefined || tabs === null){
            return res.json({
                success: false,
                message: 'Error occured while loading tabs.'
            });
        }else{
            return res.json({
                success: true,
                data: {
                    tabs: tabs
                }
            });
        }
    });
});

tabRouter.post('/save', function(req, res){
    var tabToSave = req.body;
    if(tabToSave === null || tabToSave === undefined){
        return res.json({
            success: false,
            message: 'No data found for tab.'
        });
    } else if(tabToSave.id === undefined || tabToSave.id === null) {
        // CREATE NEW TAB
        db.Tab.create({
            label: tabToSave.label,
            active: tabToSave.active,
            SObjectId: tabToSave.SObject.id,
            IconId: (tabToSave.Icon) ? tabToSave.Icon.id : null,
            order: tabToSave.order
        }).then(function(tab){
            return res.json({
                success: true,
                data: {
                    tab: tab
                }
            });
        });
    } else {
        // UPDATE EXISTING TAB
        db.Tab.update({
            label: tabToSave.label,
            active: tabToSave.active,
            SObjectId: tabToSave.SObject.id,
            created: true,
            IconId: (tabToSave.Icon) ? tabToSave.Icon.id : null,
            order: tabToSave.order
        },{
            where: {
                id: tabToSave.id
            }
        }).then(function(){
            return res.json({
                success: true
            });
        });
    }
});

tabRouter.post('/delete', function(req, res){
    var tab = req.body;
    db.Tab.update({
        label: tab.SObject.labelPlural,
        active: false,
        created: false,
        IconId: null,
        order: 0
    },{
        where: {
            id: tab.id
        }
    }).then(function(){
        return res.json({
            success: true
        });
    });
    
    // global.db.Tab.destroy({
    //     where: {
    //         id: tab.id
    //     }
    // }).then(function(affectedRows){
    //     return res.json({
    //         success: true,
    //         data: {
    //             tab: tab,
    //             affectedRows: affectedRows
    //         }
    //     });
    // });
});


module.exports = tabRouter;