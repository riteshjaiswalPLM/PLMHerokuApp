var express = require('express');
var iconRouter = express.Router();

iconRouter.post('/list', function(req, res){
    var slds = (req.body.slds != undefined && req.body.slds != null && req.body.slds === true) ? true : false;
    var Icons = db.Icon.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: (slds) ? {
                    class: {
                        $notLike: 'fa fa-%'
                    }
                } : {
                    class: {
                        $like: 'fa fa-%'
                    }
                }
    });
    
    Icons.then(function(icons) {
        if(icons === undefined || icons === null){
            return res.json({
                success: false,
                message: 'Error occured while loading icons.'
            });
        }else{
            return res.json({
                success: true,
                data: {
                    icons: icons
                }
            });
        }
    });
});

module.exports = iconRouter;