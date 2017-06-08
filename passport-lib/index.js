var Passport            = require('passport');
var StrategyConfigurer  = require('./strategy-configurer');
var InstanceManager     = require('./instance-manager');

exports = module.exports = Passport;
exports.StrategyConfigurer = StrategyConfigurer;
exports.InstanceManager = new InstanceManager();