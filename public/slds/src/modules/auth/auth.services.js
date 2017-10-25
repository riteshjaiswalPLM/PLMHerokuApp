'use strict';

auth.factory('authService',[
            '$http',
    function($http){
        return {
            authenticate: function(credentials){
                return $http.post('/api/auth/authenticate', credentials);
            },
            loadstates: function(data){
                data.viewPrefix = 'slds/';
                return $http.post('/api/auth/states', data);
            },
            mailresetpasswordlink: function(credentials){
                return $http.post('/api/auth/mailresetpasswordlink', credentials);
            },
            resetpassword: function(credentials){
                return $http.post('/api/auth/resetpassword', credentials);
            },
            resetpasswordlinkexpired: function(credentials){
                return $http.post('/api/auth/resetpasswordlinkexpired', credentials);
            },
            Translation: function(languageCode){
                return $http.post('/api/translation/', languageCode);
            },
            enableLanguages: function(){
                return $http.post('/api/translation/enableLanguages',null);
            },
        };
    }
]);

auth.factory('loginService',[
            '$location','$cookies','authService','$rootScope',
    function($location , $cookies , authService , $rootScope){
        return {
            login: function(credentials){
                credentials.currentLanguage=$cookies.getObject('languageCode');
                return authService.authenticate(credentials);
            },
            logout: function(){
                $cookies.remove('user');
                $rootScope.redirectTo();
            },
            isLoggedIn: function(){
                return $cookies.getObject('user') != undefined;
            },
            getTranslation: function(languageCode){
                return authService.Translation(languageCode);
            },
            getenableLanguages: function(){
                return authService.enableLanguages();
            },
            // saveAttempedUrl: function(){
            //     if($location.path().toLowerCase() != '/login'){
            //         redirectToUrlAfterLogin.url = $location.path();
            //     } else {
            //         redirectToUrlAfterLogin.url = '/';
            //     }
            // },
            // redirectToAttemptedUrl: function () {
            //     $location.path(redirectToUrlAfterLogin.url);
            //     $location.replace();
            // }
        };
    }
]);
auth.factory('resetPasswordService',['$location','$cookies','authService','$rootScope',
    function($location , $cookies , authService , $rootScope){
        return {
            mailresetpasswordlink: function(credentials){
                return authService.mailresetpasswordlink(credentials);
            }, 
            resetpassword: function(credentials){
                return authService.resetpassword(credentials);
            },
            checkresetpasswordlinkexpired: function(credentials){
                return authService.resetpasswordlinkexpired(credentials);
            }
        };
    }
]);