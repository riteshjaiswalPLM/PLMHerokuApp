var PassportStrategyConfigurer = function PassportStrategyConfigurer(strategy){
    this.strategy = strategy;
};
PassportStrategyConfigurer.prototype.configureStrategy = function configureStrategy(passportInstance, config, callback){
    try{
        var PassportStrategy = require('../passport-strategies/passport-'+ this.strategy.toLowerCase()); 
        var stategyInstance = new PassportStrategy(passportInstance);
        stategyInstance.configure(config, function(err, instance){
            callback(err, instance);
        });
    }catch(err){
        callback(err, null);
    }
}

exports = module.exports = PassportStrategyConfigurer;