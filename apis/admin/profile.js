var express = require('express');
var adminProfileRouter = express.Router();
var CryptoJS = require('crypto-js');

adminProfileRouter.post('/changepassword', function (req, res) {
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
                        username: user.username
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

adminProfileRouter.post('/changeemail', function (req, res) {
    var userObject = req.body;
    db.User.update({
        email: userObject.newEmail,
    }, {
            where: {
                username: userObject.username,
                email: userObject.email
            }
        }).then(function () {
            return res.json({
                success: true,
                message: "Email updated successfully."
            });
        })
        .catch(function (err) {
            console.log(err);
            return res.json({
                success: false,
                message: 'Error occured while updating email',
            });
        });
});

module.exports = adminProfileRouter;