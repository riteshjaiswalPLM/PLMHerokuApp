var jwt = require('jsonwebtoken');

var PassportInstanceManager = module.exports = function PassportInstanceManager(options) {
    this._instances = {};
    this._counter = 0;

    if (options && options.createInstance) {
        this._createInstance = options.createInstance;
    }
    if (options && options.getConfig) {
        this._getConfig = options.getConfig;
    }
};

PassportInstanceManager.prototype.getInstance = function getInstance(id, options, callback) {
    this._instances[id] = null;
    console.log('CREATING NEW INSTANCE...' + Object.keys(this._instances).length);
    if(options.passport.config.active !== true){
        callback('SSO is not active.', null);
    }
    else{
        this._createInstance(options, function doneCreateInstance(err, instance) {
            if (err) {
                console.log(err);
                delete this._instances[id];
                return callback(err);
            }
            this._instances[id] = instance;
            callback(null, instance);
        }.bind(this));
    }
}

PassportInstanceManager.prototype.getFromRequest = function getFromRequest(req, callback) {
    this._getConfig(req, function onChoice(err, id, options) {
        if (err) return callback(err);

        return this.getInstance(id, options, callback);
    }.bind(this));
}

PassportInstanceManager.prototype.attach = function attach() {
    var getFromRequest = this.getFromRequest.bind(this);

    return function attach(req, res, next) {
        getFromRequest(req, function (err, instance) {
            if (err) return next(err);

            req.passport = instance;
            return next();
        });
    };
}

PassportInstanceManager.prototype.middleware = function middleware(name) {
    var fn = ["_passportinstancemanager_cached", name, this._counter++].join('_');
    var args = [].slice.call(arguments, 1);
    console.log('INITIALIZING MIDDLEWARE FOR :: ' + name + ' :: ' + this._counter);
    return function cached(req, res, next) {
        if (!req.passport[fn]) {
            req.passport[fn] = req.passport[name].apply(req.passport, args);
        }
        console.log(req.passport);
        return req.passport[fn](req, res, next);
    };
};

PassportInstanceManager.prototype.authmiddleware = function authmiddleware(name, forRoute) {
    var fn = ["_passportinstancemanager_", name, forRoute, "_CACHED"].join('_');
    console.log('INITIALIZING AUTHENTICATION MIDDLEWARE FOR :: ' + name + " -> " + forRoute);
    return function cached(req, res, next) {
        req.passport.successRedirect = req.passport.authenticateArgs.options.successRedirect;
        delete req.passport.authenticateArgs.options.successRedirect;
        var cArguments = {
            '0': req.passport.authenticateArgs.strategy,
            '1': req.passport.authenticateArgs.options,
            length: Object.keys(req.passport.authenticateArgs).length
        }
        var args = [].slice.call(cArguments);
        if (!req.passport[fn]) {
            console.error("INSTANCE NOT FOUND: Creating new...");
            req.passport[fn] = req.passport[name].apply(req.passport, args);
        }
        var reqPass = req.passport[fn];
        return req.passport[fn](req, res, next);
    };
};

PassportInstanceManager.prototype.ssomiddleware = function ssomiddleware() {
    return function ssocached(req, res, next) {
        req.parameters = JSON.parse(JSON.stringify(req.params));
        next();
    }
}

PassportInstanceManager.prototype.generateRedirectResponse = (config, callback) => {
    var quoteattr = function (s, preserveCR) {
        preserveCR = preserveCR ? '&#13;' : '\n';
        return ('' + s)
            .replace(/&/g, '&amp;')
            .replace(/'/g, '&apos;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\r\n/g, preserveCR)
            .replace(/[\r\n]/g, preserveCR);
    };

    var filteredUserObject = {};
    var UserObject = {};
    var filterArray = null;
    if (config.application.successResponseFilter != undefined || config.application.successResponseFilter != null) {
        filterArray = config.application.successResponseFilter.split(/[ ,]+/).join(',');
        // filterArray = filterArray.toLowerCase();
        filterArray = filterArray.split(',');
        //filterArray.split(/[ ,]+/).join(',')
    }


    var formInputs = Object.keys(config.user).map(function (k) {
        if (typeof config.user[k] === 'function' || typeof config.user[k] === 'object')
            return;

        if (filterArray != null && filterArray.indexOf(k) >= 0) {
            filteredUserObject[k] = config.user[k];
            filteredUserObject.success = true;
        } else {
            UserObject[k] = config.user[k];
        }
        return '<input type="hidden" name="' + k + '" value="' + quoteattr(config.user[k]) + '" />';
    }).join('\r\n');

    if (filteredUserObject === undefined || Object.keys(filteredUserObject) === undefined || Object.keys(filteredUserObject).length === 0) {
        filteredUserObject = UserObject;
        filteredUserObject.success = true;
    }

    var encodedFilteredUserObject = jwt.sign(
        filteredUserObject,
        config.clientSecret, {
            expiresIn: 60 // 1 Minute
        });
    console.info('encodedFilteredUserObject :: ', encodedFilteredUserObject);
    console.info('encodedFilteredUserObject: :: JSON.stringify(encodedFilteredUserObject)', JSON.stringify(encodedFilteredUserObject));

    var htmlForm = ['<!DOCTYPE html>',
        '<html>',
        '<head>',
        '<meta charset="utf-8">',
        '<meta http-equiv="x-ua-compatible" content="ie=edge">',
        '</head>',
        '<body onload="document.forms[0].submit()">',
        '<noscript>',
        '<p><strong>Note:</strong> Since your browser does not support JavaScript, you must press the button below once to proceed.</p>',
        '</noscript>',
        '<form method="post" action="' + encodeURI(config.successRedirect) + '">',

        //formInputs,
        '<input type="hidden" name="id_token" value="' ,encodedFilteredUserObject, '" />',

        '<input type="submit" value="Submit" />',
        '</form>',
        '<script>document.forms[0].style.display="none";</script>', // Hide the form if JavaScript is enabled
        '</body>',
        '</html>'
    ].join('\r\n')
    console.error(htmlForm);
    callback(htmlForm);
}