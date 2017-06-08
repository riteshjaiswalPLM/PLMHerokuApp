'use strict';

auth.config(function($stateProvider) {
    
    $stateProvider
        .state('login', {
            parent: 'app',
            templateUrl: 'slds/views/app.login.html',
            controller: 'LoginController',
            title: 'Login'
        })

        // reset password link
        .state('resetpasswordlink', {
            parent: 'app',
            templateUrl: 'slds/views/app.resetpasswordlink.html',
            controller: 'ResetPasswordLinkController',
            title: 'Reset password'
        })

          // reset password
        .state('resetpassword', {
            url : '/resetpassword/:data',
            templateUrl: 'slds/views/app.resetpassword.html',
            controller: 'ResetPasswordController',
            title: 'Reset password'
        })

        .state('ssologin', {
            url : '/sso/login/:data',
            templateUrl: 'slds/views/app.login.sso.html',
            controller: 'SSOLoginController',
            title: 'SSO Login'
        });
});