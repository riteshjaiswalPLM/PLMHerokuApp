module.exports = function runHook(){
    if(global.db.hasOwnProperty('Translation') && global.db.hasOwnProperty('Language')){
        require('./language')();
    }
}