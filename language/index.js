if(!global.config.hasOwnProperty('languageconfig')){
    global.config.languageconfig = {
        languageconfig: require('./languageconfig')
    };
}
module.exports = global.config.languageconfig;