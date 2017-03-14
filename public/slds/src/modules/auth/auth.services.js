'use strict';

auth.factory('authService',[
            '$http',
    function($http){
        return {
            authenticate: function(credentials){
                return $http.post('/api/auth/authenticate', credentials);
            },
            loadstates: function(data){
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
            }
        };
    }
]);

auth.factory('loginService',[
            '$location','$cookies','authService','$rootScope',
    function($location , $cookies , authService , $rootScope){
        return {
            login: function(credentials){
                return authService.authenticate(credentials);
            },
            logout: function(){
                $cookies.remove('user');
                $rootScope.redirectTo();
            },
            isLoggedIn: function(){
                return $cookies.getObject('user') != undefined;
            }
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