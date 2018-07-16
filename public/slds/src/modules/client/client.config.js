'use strict';

client.config(function ($stateProvider) {

    $stateProvider
        .state('client', {
            parent: 'app',
            templateUrl: 'slds/views/app.client.html',
            controller: 'ClientController',
        })
        .state('client.profile.manage', {
            templateUrl: 'slds/views/client/profile/manage.html',
            controller: 'ClientProfileManageController',
            title: 'Manage Profile'
        })
        .state('client.profile.changepassword', {
            templateUrl: 'slds/views/client/profile/changepassword.html',
            controller: 'ClientProfileChangePasswordController',
            title: 'Change Password'
        })
        .state('client.profile.other', {
            templateUrl: 'slds/views/client/profile/other.html',
            controller: 'ClientProfileOtherController',
            title: 'Other Settings'
        })
        .state('client.reports', {
            templateUrl: 'slds/views/client/report/index.html',
            controller: 'ClientReportsController',
            title: 'Reports'
        })
        .state('client.bulkcreation', {
            templateUrl: 'slds/views/client/bulkcreation/upload.html',
            controller: 'CSVUploadController',
            title: 'CSV Upload'
        })
        .state('client.archival', {
            templateUrl: 'slds/views/client/archival/index.html',
            controller: 'ClientArchivalsController',
            params:{
                LayoutId: null
            },
            title: 'Archival'
        })
        .state('client.archivaldetail', {
            templateUrl: 'slds/views/client/archival/detail.html',
            controller: 'ClientArchivalDetailLayoutController',
            params:{
                data: null
            },
            title: 'archival detail'
        })
});