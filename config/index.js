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
            password: 'akritiv@123',
            token: 'pz7obelVbXKHo7qrH1xsJYaC',
            environment: 'PRODUCTION'
        },
        demo_sfdc: {
           username: 'admin@esm.demo3',
            password: 'akritiv*1234',
            token: 'q5HveDEOSkyobijMVunvpEoE',
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
        },
        dashboardConfig :{
            title: 'My Task',
            tabLabel: 'Home',
            icon: 'fa fa-dashboard',
            tabICON: 'fa fa-dashboard',
            sldsicon: 'dashboard',
            sldstabICON: 'home',
            active: true,
            showRefreshResult: true
        },
        archivalConfig :{
            title: 'Archival',
            tabLabel: 'Archival',
            icon: 'fa fa-archive',
            tabICON: 'fa fa-archive',
            sldsicon: 'summary',
            sldstabICON: 'summary',
            active: true,
            showRefreshResult: true
        }
    };
}

module.exports = global.config;