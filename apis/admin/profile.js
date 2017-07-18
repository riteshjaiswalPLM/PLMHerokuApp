var express = require('express');
var adminProfileRouter = express.Router();
var CryptoJS = require('crypto-js');

adminProfileRouter.post('/changepassword', function (req, res) {
    var baseURL = process.env.MOBILE_AUTH_INSTANCE_URL || 'https://esm-mob-auth-v3.herokuapp.com';
    var userObject = req.body;
    var User = db.User.findOne({
        include: {
            model: db.Role,
            attributes: {
                exclude: ['id', 'createdAt', 'updatedAt', 'system']
            }
        },
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'RoleId', 'active', 'password']
        },
        where: {
            username: userObject.username,
            password: CryptoJS.MD5(userObject.credentials.password).toString()
        }
    });

    User.then(function (user) {
        if (user === null || user === undefined) {
            return res.json({
                success: false,
                message: 'Current password does not match.',
            });
        } else {
            db.User.update({
                password: userObject.credentials.newPassword,
            }, {
                    where: {
                        id: user.id,
                        username: user.username,
                    }
                }).then(function () {
                    return res.json({
                        success: true,
                        message: "Password updated successfully."
                    });
                })
                .catch(function (err) {
                    console.log(err);
                    return res.json({
                        success: false,
                        message: 'Error occured while reseting password',
                    });
                });
        }
    });
});

module.exports = adminProfileRouter;