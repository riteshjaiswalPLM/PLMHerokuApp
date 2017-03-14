if(!global.hasOwnProperty('config')){
    global.config = {
        constant: require('./constant'),
        db: {
            dbname:     'esm-node',
            username:   'postgres',
            password:   'kaushik'
        },
        sfdc: {
            username: 'mekyush.jariwala@esmdev.com',
            password: 'akritiv*1234',
            token: 'pz7obelVbXKHo7qrH1xsJYaC',
            environment: 'PRODUCTION'
        },
        smtpconfig :{
                host: 'smtp.gmail.com',
                port: 587,
                secure: false, // use SSL
                auth: {
                    user: 'customer.support@akritiv.com',
                    pass: '@kritiv*support'
                }
        }
    };
}

module.exports = global.config;