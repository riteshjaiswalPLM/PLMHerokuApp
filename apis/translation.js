var express = require('express');
var jwt = require('jsonwebtoken');
var CryptoJS = require('crypto-js');
var authRouter = express.Router();
var request = require('request');

authRouter.post('/', function(req, res){
    if(req.body.languageCode == undefined){
        return res.json({
            translations:{'en':languageconfig.loginPageTransaltionMap['en']}
        })
    }
    else{
        var translations={};
        translations[req.body.languageCode]=languageconfig.loginPageTransaltionMap[req.body.languageCode]
        return res.json({
             translations:translations,
        })
    }
    
});
authRouter.post('/enableLanguages', function(req, res){
    return res.json({
        enableLanguages:global.languageconfig.enableLanguages,
    })
});
module.exports = authRouter;