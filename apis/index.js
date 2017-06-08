var express = require('express');
var jwt = require('jsonwebtoken');
var apiRouter = express.Router();

apiRouter.use('/salesforce', require('./getorgdetail'));
// Authentication Apis
apiRouter.use('/auth', require('./auth'));
apiRouter.use('/sso', require('./sso'));

// Middleware to protect API Routes
apiRouter.use(function(req, res, next){
    // check header parameters for token
    var token = req.headers[config.constant.X_ACCESS_TOKEN_HEADER];

    // decode token
    if(token){
        jwt.verify(token, config.constant.SECRET_KEY, function(error, decoded){
            if(error){
                return res.status(403).send({
                    success: false,
                    message: message.auth.error.FAILED_TO_AUTHENTICATE_TOKEN
                });
            } else {
                req.token = decoded;
                next();
            }
        });
    } else {
        return res.status(403).send({
            success: false,
            message: message.auth.error.NO_TOKEN_PROVIDED
        });
    }
});

// Secured Apis
apiRouter.use('/sfdc', require('./sfdc'));

// Admin Apis
apiRouter.use('/admin', require('./admin'));

// Client service Apis
apiRouter.use('/service', require('./service'));

module.exports = apiRouter;