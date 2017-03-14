'use strict';

auth.config(function($stateProvider) {
    
    $stateProvider
        .state('login', {
            parent: 'app',
            templateUrl: 'views/app.login.html',
            controller: 'LoginController',
            title: 'Login'
        })

        // reset password link
        .state('resetpasswordlink', {
            parent: 'app',
            templateUrl: 'views/app.resetpasswordlink.html',
            controller: 'ResetPasswordLinkController',
            title: 'Reset password'
        })

          // reset password
        .state('resetpassword', {
            url : '/resetpassword/:data',
            templateUrl: 'views/app.resetpassword.html',
            controller: 'ResetPasswordController',
            title: 'Reset password'
        });
});