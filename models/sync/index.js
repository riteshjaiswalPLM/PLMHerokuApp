module.exports = {
    start: function(models,syncCallback){
        var application = require('./application');
        var sfdc = require('./sfdc');
        var icon = require('./icon');
        var role = require('./role');
        var user = require('./user');
        var language = require('./language');
        var translation = require('./translation');
        var timezone = require('./timezone');
        var locale = require('./locale');
        var ssoconfig = require('./ssoconfig');
        
        var objectsToSync = [application, sfdc, icon, user, language, translation, timezone, locale, ssoconfig];
        
        async.each(objectsToSync, function(object, callback){
            object.sync(models, function(err){
                if(err){
                    callback(err);
                }else{
                    callback();
                }
            });
        }, function(err){
            if(err){
                console.error(err);
                syncCallback(err);
            }
            console.info('All objects synchronized successfully!');
            syncCallback();
            // return;
        });
    }  
};

function name(params) {
    // db.sequelize.transaction(function(t){
    db.sequelize.transaction().then(function(t){
        var options = {
            // raw: true, 
            transaction: t
        };
        var sQueries = [];
        async.each(sQueries, function(sQuery, callback){
            db.sequelize.query(sQuery, null, options).then(function(){
                callback && callback();
            });
        }, function(err){
            if(err){
                console.log(err);
            }
            return t.commit();
        })
    }).then(function(){
        t.commit();
    }).catch(function(err){
        t.rollback();
    });
    // }).success(function(){

    // });
}