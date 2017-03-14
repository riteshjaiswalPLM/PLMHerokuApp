module.exports = {
    sync: function(models, callback){
        var Role = models.Role;
        
        Role.sync().then(function(){
            Role.count().then(function(roleCount){
                if(roleCount === 0){
                    Role.bulkCreate([
                        { name: 'ADMINISTRATOR',    system: true },
                        { name: 'BUYER',            system: false }
                    ]).then(function(){
                        console.log("Roles created successfully!");
                        callback && callback();
                    });
                }else{
                    callback && callback();
                }
            });
        });
    }
};