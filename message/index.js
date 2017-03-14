if(!global.hasOwnProperty('message')){
    global.message = {
        auth: require('./auth')  
    };
}
module.exports = global.message;