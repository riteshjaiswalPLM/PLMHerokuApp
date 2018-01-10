var fs = require('fs');
var path = require('path');

module.exports = {
    sync: function (models, callback) {
        var Logo = models.Logo;

        Logo.sync().then(function () {
            var homeLogoLoaded = false;
            var headerLogoLoaded = false;
            Logo.findAll({
                attributes: ['logo'],
                where: {
                    title: "Home Logo",
                    logo: {
                        $ne: ""
                    }
                }
            }).then(function (recHomeLogo) {
                if (recHomeLogo != undefined && recHomeLogo != null) {
                    if (recHomeLogo.length == 0) {
                        Logo.build({
                            title: "Home Logo",
                            logo: fs.readFileSync(path.join(__dirname) + '/../../public/resources/images/homeLogo.png').toString("base64")
                        }).save().then(function (logo) {
                            homeLogoLoaded = true;
                            console.log("Home Logo created successfully!");
                            if (homeLogoLoaded && headerLogoLoaded) {
                                callback && callback();
                            }
                        }).catch(function (error) {
                            homeLogoLoaded = true;
                            console.error(error);
                            if (homeLogoLoaded && headerLogoLoaded) {
                                callback && callback(error);
                            }
                        });
                    } else {
                        fs.writeFileSync(path.join(__dirname) + '/../../public/resources/images/homeLogo.png', recHomeLogo[0].logo, "base64");
                        console.log("Home Logo synced successfully!");
                        homeLogoLoaded = true;
                        if (homeLogoLoaded && headerLogoLoaded) {
                            callback && callback();
                        }
                    }
                } else {
                    homeLogoLoaded = true;
                    if (homeLogoLoaded && headerLogoLoaded) {
                        callback && callback();
                    }
                }
            });
            Logo.findAll({
                attributes: ['logo'],
                where: {
                    title: "Header Logo",
                    logo: {
                        $ne: ""
                    }
                }
            }).then(function (recHeaderLogo) {
                if (recHeaderLogo != undefined && recHeaderLogo != null) {
                    if (recHeaderLogo.length == 0) {
                        Logo.build({
                            title: "Header Logo",
                            logo: fs.readFileSync(path.join(__dirname) + '/../../public/resources/images/logo/headerLogo.png').toString("base64")
                        }).save().then(function (logo) {
                            headerLogoLoaded = true;
                            console.log("Header Logo created successfully!");
                            if (homeLogoLoaded && headerLogoLoaded) {
                                callback && callback();
                            }
                        }).catch(function (error) {
                            headerLogoLoaded = true;
                            console.error(error);
                            if (homeLogoLoaded && headerLogoLoaded) {
                                callback && callback(error);
                            }
                        });
                    } else {
                        fs.writeFileSync(path.join(__dirname) + '/../../public/resources/images/logo/headerLogo.png', recHeaderLogo[0].logo, "base64");
                        console.log("Header Logo synced successfully!");
                        headerLogoLoaded = true;
                        if (homeLogoLoaded && headerLogoLoaded) {
                            callback && callback();
                        }
                    }
                }
                else {
                    headerLogoLoaded = true;
                    if (homeLogoLoaded && headerLogoLoaded) {
                        callback && callback();
                    }
                }
            });
        });
    }
}