var nodeMailer = require('nodemailer');

if(!global.hasOwnProperty('db')){
    var fs = require('fs');
    var path = require('path');
    var sync = require('./sync');
    var Sequelize = require('sequelize'),
        sequelize = null;
        
    if(process.env.DATABASE_URL){
        sequelize = new Sequelize(process.env.DATABASE_URL,{});        
    }else{
        var db = global.config.db;
        sequelize = new Sequelize(db.dbname,db.username,db.password,{
            host: 'localhost',
            dialect: 'postgres',
            pool:{max: 5, min: 0, idle: 10000}
        });
    }
    
    var db = {};
    fs.readdirSync(__dirname)
        .filter(function(file){
            return (file.indexOf(".") !== 0) && (file !== "index.js") && (file !== "sync");
        })
        .forEach(function(file){
            var model = sequelize.import(path.join(__dirname, file));
            db[model.name] = model;
        });
    
    Object.keys(db).forEach(function(modelName) {
        if ("associate" in db[modelName]) {
            db[modelName].associate(db);
        }
    });
    
    //sync.start(db);
    
    db.Sequelize = Sequelize;
    db.sequelize = sequelize;
    
    global.db = db;
}

module.exports = global.db; 