var express = require('express');
var sfdcRouter = express.Router();

sfdcRouter.post('/describeSObjects', function(req, res){
    global.sfdc.describeSObjects(function(err, response){
        if(err){
            return res.json({
                success: false,
                message: "Error occured while loading sobjects from salesforce!",
                error: err
            });
        }else{
            return res.json({
                success: true,
                data: response
            });
        }
    });
});

module.exports = sfdcRouter;