if(!global.config.hasOwnProperty('staticcomponentconfig')){
    global.config.staticcomponentconfig = {
        staticcomponent: require('./staticcomponentconfig')
    };
}
module.exports = global.config.staticcomponent;