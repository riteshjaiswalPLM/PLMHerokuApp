var express = require('express');
var request = require('request');
var archivalRouter = express.Router();

var headers = {
    "Content-type": "application/json; charset=utf8",
    "Authorization": "Basic ZXNtRGV2VXNlcjpha3JpdGl2QDEyMw==",
    "impl":"esmDev"
}

archivalRouter.post('/invoices', function(req, res){
    console.log('data:-',req.body);
    request.post({
        url: "http://54.88.100.146:8080/AkritivArchiveApp/archive/process/search", 
        headers: headers,
        json: {
                columns: [],
                filters:req.body,
                table:'INVOICE'
            
        }
    }, function(err,httpResponse,body){
        if(err)return next(err);
        //console.log('err:-', err.message);
        //console.log('httpResponse:-', httpResponse);
        //console.log('body:-', body);
        return res.json({success: true,data:body});
    });
});

module.exports = archivalRouter;