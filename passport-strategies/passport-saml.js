var fs = require('fs');
var SamlStrategy = require('passport-saml').Strategy;

var PassportSaml = module.exports = function PassportSaml(passport){
    this.passport = passport;
    this.strategyName = 'SAML';
}
PassportSaml.prototype.configure = function configure(config, callback){
    try{
        if(this.passport){
            this.passport.serializeUser(function (user, done) {
                done(null, user);
            });

            this.passport.deserializeUser(function (user, done) {
                done(null, user);
            });

            this.passport['authenticateArgs'] = {
                strategy: 'saml',
                options: {
                    successRedirect: '/',
                    failureRedirect: '/'
                }
            };
            
            this.passport.use(new SamlStrategy(config,
                function (profile, done) {
                    return done(null, profile);
                })
            );
            console.error("this.passport :: ",this.passport);
            callback(null, this.passport);
        }else{
            callback({
                message: 'Passport not defined for SAML strategy!'
            }, null);
        }
    }catch(err){
        callback(err, null);
    }
}