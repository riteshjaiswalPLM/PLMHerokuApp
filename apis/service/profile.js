var express = require('express');
var CryptoJS = require('crypto-js');
var profileRouter = express.Router();

profileRouter.post('/languagelist', function(req, res){
    var languagelist = [];
    var transaltionMapArrived = false
    for(var key in languageconfig){
        if(key === 'languageTransaltionMap')
            transaltionMapArrived = true
        if(transaltionMapArrived && key !== 'languageTransaltionMap' && languageconfig[key].active){
            languagelist.push({id: languageconfig[key].id, name: languageconfig[key].name, code: languageconfig[key].code});
        }
    }
    return res.json({
        success: true,
        data: {
            languagelist: languagelist
        }
    });
});

profileRouter.post('/saveothersettings', function(req, res){
    var otherSettings = req.body;
    var translations = {}
    translations[otherSettings.Language.code] = languageconfig.languageTransaltionMap[otherSettings.Language.code]
    global.db.User.update({LanguageId: otherSettings.Language.id},{
        where: {
            username: otherSettings.user.username
        }
    }).then(function(updatedUser){
        return res.json({
            success: true,
            translations: translations,
            message: 'Settings saved successfully.'
        });
    });
});

profileRouter.post('/changepassword', function(req, res){
    var userObject = req.body;
    var User = db.User.findOne({
        include: {
            model: db.Role,
            attributes: {
                exclude: ['id','createdAt','updatedAt','system']
            }
        },
        attributes: {
            exclude: ['createdAt','updatedAt','RoleId','active','password']
        },
        where: {
            username: userObject.username,
            password: CryptoJS.MD5(userObject.credentials.password).toString()
        }
    });
    
    User.then(function(user){
        if(user === null || user === undefined){
            return res.json({
                success: false,
                message: 'Current password does not match.',
            });
        }else{
            db.User.update({
                    password: userObject.credentials.newPassword,
                },{
                    where: {
                        id: user.id,
                        username: user.username,
                    }
                }).then(function(){
                    return res.json({
                        success: true,
                        message: "Password updated successfully."
                    });
                })
                .catch(function(err){
                     console.log(err);
                     return res.json({
                         success: false,
                         message: 'Error occured while reseting password',
                     });
                });
        }
    });
});

module.exports = profileRouter;