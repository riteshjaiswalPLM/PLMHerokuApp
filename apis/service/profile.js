var express = require('express');
var CryptoJS = require('crypto-js');
var formidable = require('formidable');
var fs = require('fs');
var path = require('path');
var profileRouter = express.Router();
var request = require('request');

profileRouter.post('/loadstaticlist', function(req, res){
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
            languagelist: languagelist,
            timezone: timezone.list,
            locale: locale.list
        }
    });
});

profileRouter.post('/saveothersettings', function(req, res){
    var otherSettings = req.body;
    var translations = {}
    translations[otherSettings.Language.code] = languageconfig.languageTransaltionMap[otherSettings.Language.code]
    global.db.User.update({LanguageId: otherSettings.Language.id, LocaleId: otherSettings.LocaleId, TimeZoneId: otherSettings.TimeZoneId},{
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
    var baseURL = process.env.MOBILE_AUTH_INSTANCE_URL || 'https://esm-mob-auth-v3.herokuapp.com';
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
                    var UserMapping = db.UserMapping.findAll({
                        attributes: {
                            exclude: ['createdAt','updatedAt']
                        },
                        order: [
                            ['id']
                        ]
                    });
                    UserMapping.then(function(userMapping){
                        if(userMapping && userMapping.length > 0){
                            if(userMapping[0].isMobileActive === true){
                                request({
                                    url: baseURL + '/api/mobusers/updation',
                                    method: 'post',
                                    json: {
                                        username:user.username,
                                        password:CryptoJS.MD5(userObject.credentials.newPassword).toString(),
                                        old_username:userObject.username,
                                        isEncryptionEnabled :true
                                    }
                                }, function(error, response, body){
                                    if(error) {
                                        console.log(error);
                                        //rollback
                                        db.User.update({password: userObject.credentials.password},{
                                            where: {
                                                id: user.id,
                                                username: user.username,
                                            }
                                        });

                                        res.json({
                                            success: false,
                                            message: 'Error occured on server while sending message.\nError: ' + error.message
                                        });
                                    } 
                                    else{
                                        if(response.statusCode === 500){
                                            //rollback
                                            db.User.update({password: userObject.credentials.password},{
                                                where: {
                                                    id: user.id,
                                                    username: user.username,
                                                }
                                            });
                                            res.json({
                                                success: false,
                                                message: response.body.errormessage
                                            }); 
                                        }
                                        else{
                                            return res.json({
                                                success: true,
                                                message: "Password updated successfully."
                                            });
                                        }
                                    }
                                });
                            }
                            else{
                                return res.json({
                                    success: true,
                                    message: "Password updated successfully."
                                });
                            }
                        }
                        else{
                            return res.json({
                                success: true,
                                message: "Password updated successfully."
                            });
                        }
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

profileRouter.post('/setAvatarForUser', function (req, res) {
    var avatarpath = path.join("./public/slds221/assets/images/", req.body.avatar + ".jpg");
    var filepath = path.join("./public/resources/images/profiles/", req.body.Id + "userAvatar.jpg");
    var imageString = "";
    try {
        imageString = fs.readFileSync(path.join(__dirname) + '/../../' + avatarpath).toString("base64");
        let readStream = fs.createReadStream(avatarpath);
        readStream.once('error', (err) => {
            return res.json({
                success: false,
                message: 'Error occured while updating profile image.',
                error: err
            });
        });

        readStream.once('end', () => {
            if (req.body.Id != undefined && req.body.Id != "" && req.body.Id != "Admin") {
                db.User.update({
                    profileImage: imageString
                }, {
                        where: {
                            id: req.body.Id
                        }
                    }).then(function () {
                        return res.json({
                            success: true,
                            path: path.join("/resources/images/profiles/", req.body.Id + "userAvatar.jpg")
                        });
                    }).catch(function (err) {
                        return res.json({
                            success: false,
                            error: err
                        });
                    });
            }
            else if (req.body.Id != undefined && req.body.Id == "Admin") {
                db.User.update({
                    profileImage: imageString
                }, {
                        where: {
                            username: "Administrator"
                        }
                    }).then(function () {
                        return res.json({
                            success: true,
                            path: path.join("/resources/images/profiles/", req.body.Id + "userAvatar.jpg")
                        });
                    }).catch(function (err) {
                        return res.json({
                            success: false,
                            error: err
                        });
                    });
            }
            else {
                return res.json({
                    success: true,
                    path: path.join("/resources/images/profiles/", req.body.Id + "userAvatar.jpg")
                });
            }
        });

        readStream.pipe(fs.createWriteStream(filepath));
    }
    catch (err) {
        return res.json({
            success: false,
            message: 'Error occured while updating profile image.',
            error: err
        });
    }
});

profileRouter.post('/getUserProfileImg', function (req, res) {
    var filepath = path.join("./public/resources/images/profiles/", req.body.Id + "userAvatar.jpg");
    fs.stat(filepath, function (err, stat) {
        if (err == null) {
            return res.json({
                success: true,
                path: path.join("/resources/images/profiles/", req.body.Id + "userAvatar.jpg")
            });
        } else {
            return res.json({
                success: true,
                path: '/resources/images/profiles/userAvatar.jpg'
            });
        }
    });
});

profileRouter.post('/userProfileImgconfig', function (req, res) {
    var form = new formidable.IncomingForm();
    form.multiples = true;
    form.uploadDir = "./public/resources/images/profiles/";
    form.parse(req);
    var imageString = "";
    var userID = "";

    form.on('file', function (field, file) {
        if (req.cookies != undefined && req.cookies != null && req.cookies.user != undefined && req.cookies.user != null && req.cookies.user != '') {
            var userObject = JSON.parse(req.cookies.user);
            imageString = fs.readFileSync(path.join(__dirname) + '/../../' + file.path).toString("base64");
            if (userObject != undefined && userObject != null && userObject.userdata != undefined && userObject.userdata != null && userObject.userdata != '' && userObject.username != 'Administrator') {
                var userData = JSON.parse(userObject.userdata);
                if (userData != undefined && userData != null && userData.Id != undefined && userData.Id != null && userData.Id != '') {
                    userID = userData.Id;
                    fs.rename(file.path, path.join(form.uploadDir, userData.Id + 'userAvatar.jpg'));
                }
            }
            else if (userObject != undefined && userObject != null && userObject.username == 'Administrator') {
                userID = 'Administrator';
                fs.rename(file.path, path.join(form.uploadDir, 'AdminuserAvatar.jpg'));
            }
        }
    });

    form.on('error', function (err) {
        return res.json({
            success: false,
            error: err
        });
    });

    form.on('end', function () {
        if (userID != undefined && userID != "" && userID != "Administrator") {
            db.User.update({
                profileImage: imageString
            }, {
                    where: {
                        id: userID
                    }
                }).then(function () {
                    return res.json({
                        success: true
                    });
                }).catch(function (err) {
                    return res.json({
                        success: false,
                        error: err
                    });
                });
        }
        else if (userID != undefined && userID == "Administrator") {
            db.User.update({
                profileImage: imageString
            }, {
                    where: {
                        username: userID
                    }
                }).then(function () {
                    return res.json({
                        success: true
                    });
                }).catch(function (err) {
                    return res.json({
                        success: false,
                        error: err
                    });
                });
        }
        else {
            return res.json({
                success: true
            });
        }
    });
});

module.exports = profileRouter;