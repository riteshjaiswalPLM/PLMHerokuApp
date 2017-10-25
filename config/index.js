if(!global.hasOwnProperty('config')){
    global.config = {
        constant: require('./constant'),
        db: {
            dbname:     'lightning_product_qa',
            username:   'postgres',
            password:   'admin@123'
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
                user: 'notification.customercare@gmail.com',
                pass: 'Akritiv*123'
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
            active: false,
            showRefreshResult: true
        }
    };
}

module.exports = global.config;