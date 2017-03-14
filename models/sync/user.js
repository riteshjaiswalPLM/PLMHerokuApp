module.exports = {
    sync: function(models, callback){
        var User = models.User;
        var Role = models.Role;
        
        Role.sync().then(function(){
            Role.count().then(function(roleCount){
                if(roleCount === 0){
                    Role.bulkCreate([
                        { name: 'ADMINISTRATOR',    system: true },
                        { name: 'USER',            system: false, default: true }
                    ]).then(function(){
                        console.log("Roles created successfully!");
                        // callback && callback();
                        User.sync().then(function(){
                            User.count().then(function(userCount){
                                if(userCount === 0){
                                    User.bulkCreate([
                                        {
                                            firstname: 'System',
                                            lastname: 'Administrator',
                                            username: 'Administrator',
                                            email: process.env.ADMINISTRATOR_EMAIL || 'kaushik.rathod@sftpl.com',
                                            password: 'sailfin@123',
                                            active: true,
                                            userdata: {},
                                            RoleId: 1
                                        }
                                    ]).then(function(){
                                        console.log("Users created successfully!");
                                        callback && callback();
                                    });
                                }else{
                                    callback && callback();
                                }
                            });
                        });
                    });
                }else{
                    callback && callback();
                }
            });
        });
    }
};