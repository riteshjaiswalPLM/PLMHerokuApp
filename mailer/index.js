if(!global.config.hasOwnProperty('mailconfig')){
    global.config.mailconfig = {
        mailconfig: require('./mailconfig')
    };
}
module.exports = global.config.mailconfig;