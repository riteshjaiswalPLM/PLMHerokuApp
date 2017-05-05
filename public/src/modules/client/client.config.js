'use strict';

client.config(function($stateProvider) {
    
    $stateProvider
        .state('client', {
            parent: 'app',
            templateUrl: 'views/app.client.html',
            controller: 'ClientController',
        })
        .state('client.profile.manage', {
            templateUrl: 'views/client/profile/manage.html',
            controller: 'ClientProfileManageController',
            title: 'Manage Profile'
        })
        .state('client.profile.changepassword', {
            templateUrl: 'views/client/profile/changepassword.html',
            controller: 'ClientProfileChangePasswordController',
            title: 'Change Password'
        })
        .state('client.profile.other', {
            templateUrl: 'views/client/profile/other.html',
            controller: 'ClientProfileOtherController',
            title: 'Other Settings'
        });
});