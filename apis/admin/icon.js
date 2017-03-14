var express = require('express');
var iconRouter = express.Router();

iconRouter.post('/list', function(req, res){
    var Icons = db.Icon.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
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