'use strict';

auth.factory('httpAuthInterceptor',['$q','$cookies','$injector','$rootScope','$localStorage',function($q,$cookies, $injector,$rootScope,$localStorage){
    return {
        request: function(config){
            // console.log('httpAuthInterceptor.Request');
            // console.log(config.url);
            
            var loginService = $injector.get('loginService');
            if(!loginService.isLoggedIn() && config.url.startsWith('/api/') && config.url !== '/api/auth/authenticate' && config.url !== '/api/auth/mailresetpasswordlink' &&  config.url !== '/api/auth/resetpassword' &&  config.url !== '/api/auth/resetpasswordlinkexpired'  ){
                // console.log('Not logged in!!!');
                $rootScope.redirectTo('login');
            }else if(loginService.isLoggedIn()){
                var token = $cookies.getObject('user').token;
                config.headers['x-access-token'] = token;
            }
            // console.info(config);
            return config;
        },
        response: function(response){
            // console.log('httpAuthInterceptor.Response');
            // console.log(response);
            
            var loginService = $injector.get('loginService');
            // if(response.status === 403){
            //     $rootScope.logout();
            //     // $rootScope.redirectTo('login');
            // } else 
            if (response.config.url === '/api/auth/authenticate' && response.status === 200 && response.data.token != undefined && response.data.user != undefined){
                var user = response.data.user;
                user.token = response.data.token;
                $localStorage.translations = response.data.translation;
                // $localStorage.set('translations', response.data.translation);
                $cookies.putObject('user', user);
                $rootScope.redirectTo();
            }
            return response;
        },
        responseError: function(rejection){
            if(rejection.status === 403){
                $rootScope.logout();
                // $rootScope.redirectTo('login');
            }else{
                return $q.reject(rejection);
            }
        }
    };
}]);
