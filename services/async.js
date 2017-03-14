if(!global.hasOwnProperty('async')){
    var async = require('async');
    global.async = async;
}

module.exports = global.async;