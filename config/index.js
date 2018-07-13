if(!global.hasOwnProperty('config')){
    global.config = {
        constant: require('./constant'),
        db: {
            //dbname:     'baxter-uat',
            //dbname:     'esm-mitie-local',
            //dbname:     'esmqa2',
            //dbname:     'esmqa',
            //dbname:     'mhi',
            dbname:     'newplm',
            //dbname:     'esm-devhub',
            username:   'postgres',
            password:   'admin'
        },
        sfdc: {
            username: 'moxesh.shah@coraplm.dev',
            password: 'Shahmox@31200#',
            token: '',
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