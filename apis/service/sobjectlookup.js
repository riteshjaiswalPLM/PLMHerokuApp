var express = require('express');
var sobjectLookupRouter = express.Router();

sobjectLookupRouter.post('/metadata', function(req, res){
    var layoutField = req.body;
    var where = undefined; 
    if(layoutField.SObjectLookupId !== null && layoutField.SObjectLookupId !== undefined){
        where = {
            id: layoutField.SObjectLookupId  
        }
    }else{
        where = {
            default: true,
            sobjectname: layoutField.SObjectField.referenceTo[0]
        }
    }
    var loadLookupMetadata = db.SObjectLookup.findOne({
        include: [{
            model: db.SObjectLayoutField,
            attributes: {
                exclude: ['createdAt','updatedAt']
            },
            include: {
                model: db.SObjectField,
                attributes: {
                    exclude: ['createdAt','updatedAt']
                }
            },
            where: {
                type: 'SObject-Lookup-Field'
            },
            order: [
                ['order']
            ]
        }],
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: where
    });
    loadLookupMetadata.then(function(lookupMetadata){
        if(lookupMetadata === undefined || lookupMetadata === null){
            return res.json({
                success: false,
                message: 'Error occured while loading lookup metadata.'
            });
        }else{
            return res.json({
                success: true,
                data: {
                    metadata: lookupMetadata
                }
            });
        }
    });
});

module.exports = sobjectLookupRouter;