'use strict';

admin.config(function($stateProvider) {
    
    $stateProvider
        // Admin root
        .state('admin', {
            parent: 'app',
            templateUrl: 'views/app.admin.html',
            controller: 'AdminController',
        })
        
        // Admin Dashboard
        .state('admin.dashboard', {
            templateUrl: 'views/admin/dashboard.html',
            controller: 'AdminDashboardController',
            title: 'Dashboard'
        })
        
        // Admin Tabs
        .state("admin.tabs", {
            templateUrl: "views/admin/tab/index.html",
            controller: 'AdminTabsController'
        })
        .state("admin.tabs.list", {
            templateUrl: "views/admin/tab/list.html",
            controller: "AdminTabsListController",
            title: "Tabs"
        })
        .state("admin.tabs.edit", {
            templateUrl: "views/admin/tab/edit.html",
            controller: "AdminTabsEditController",
            params:{
                tab: null
            },
            title: "Tab"
        })
        
        // Admin Layouts
        .state("admin.layouts", {
            templateUrl: "views/admin/layout/index.html",
            controller: 'AdminLayoutsController'
        })
        .state("admin.layouts.list", {
            templateUrl: "views/admin/layout/list.html",
            controller: "AdminLayoutsListController",
            title: "Layouts"
        })
        .state("admin.layouts.edit", {
            templateUrl: "views/admin/layout/edit.html",
            controller: "AdminLayoutsEditController",
            params:{
                layout: null
            },
            title: "Edit Layout"
        })
        
        // Admin Custom Lookups
        .state("admin.lookups", {
            templateUrl: "views/admin/lookup/index.html",
            controller: 'AdminLookupsController'
        })
        .state("admin.lookups.list", {
            templateUrl: "views/admin/lookup/list.html",
            controller: "AdminLookupsListController",
            title: "Lookups"
        })
        .state("admin.lookups.edit", {
            templateUrl: "views/admin/lookup/edit.html",
            controller: "AdminLookupsEditController",
            params:{
                lookup: null
            },
            title: "Lookup"
        })

        // Admin User Management
        .state("admin.usermanagement", {
            templateUrl: "views/admin/usermanagement/index.html",
            controller: "AdminUserManagementController"
        })
        .state("admin.usermanagement.users",{
            templateUrl: "views/admin/usermanagement/users/index.html",
            controller: "AdminUserManagementUsersController",
        })
        .state("admin.usermanagement.users.list",{
            templateUrl: "views/admin/usermanagement/users/list.html",
            controller: "AdminUserManagementUsersListController",
            title: "Manage Users"
        })
        .state("admin.usermanagement.users.create",{
            templateUrl: "views/admin/usermanagement/users/create.html",
            controller: "AdminUserManagementUsersCreateController",
            params:{
                userData: null
            },
            title: "Create Users"
        })
        .state("admin.usermanagement.users.edit",{
            templateUrl: "views/admin/usermanagement/users/edit.html",
            controller: "AdminUserManagementUsersEditController",
            params:{
                userData: null
            },
            title: "Edit Users"
        })
        .state("admin.usermanagement.profile",{
            templateUrl: "views/admin/usermanagement/profile/userprofilelayout.html",
            controller: "AdminUserManagementUsersProfileController",
            title: "Manage Profile Layout"
        })
        .state("admin.usermanagement.createlayout",{
            templateUrl: "views/admin/usermanagement/userlayout/userlayout.html",
            controller: "AdminUserManageUsersLayoutController",
            title: "Manage User Layout"
        })
        .state("admin.usermanagement.roles",{
            templateUrl: "views/admin/usermanagement/roles/index.html",
            controller: "AdminUserManagementRolesController",
        })
        .state("admin.usermanagement.roles.list",{
            templateUrl: "views/admin/usermanagement/roles/list.html",
            controller: "AdminUserManagementRolesListController",
            title: "Manage Roles"
        })

        // Admin Setup Routes
        .state("admin.setup", {
            templateUrl: "views/admin/setup/index.html",
            controller: "AdminSetupController"
        })
        .state("admin.setup.sfdc",{
            templateUrl: "views/admin/setup/sfdc/view.html",
            controller: "AdminSetupSfdcController",
            title: "Salesforce Org"
        })
        //-- SOBJECTS SETUP
        .state("admin.setup.sobjects", {
            templateUrl: "views/admin/setup/sobject/index.html",
            controller: 'AdminSetupSObjectsController'
        })
        .state("admin.setup.sobjects.list", {
            templateUrl: "views/admin/setup/sobject/list.html",
            controller: "AdminSetupSObjectsListController",
            title: "SObjects"
        })
        .state("admin.setup.sobjects.manage", {
            templateUrl: "views/admin/setup/sobject/manage.html",
            controller: "AdminSetupSObjectsManageController",
            title: "Manage SObjects"
        })
        .state("admin.setup.sobjects.details", {
            templateUrl: "views/admin/setup/sobject/details.html",
            controller: "AdminSetupSObjectsDetailsController",
            params:{
                sObject: null
            },
            title: "SObjects details"
        })
        //-- USER MAPPING SETUP
        .state("admin.setup.usermapping",{
            templateUrl: "views/admin/setup/usermapping/view.html",
            controller: "AdminSetupUserMappingController",
            title: "User Mapping"
        })
        
        // Admin Languages
        .state("admin.languages",{
            templateUrl: "views/admin/language/index.html",
            controller: 'AdminLanguagesController'
        })
        .state("admin.languages.list", {
            templateUrl: "views/admin/language/list.html",
            controller: "AdminLanguagesListController",
            title: "Languages"
        })
        .state("admin.languages.edit", {
            templateUrl: "views/admin/language/edit.html",
            controller: "AdminLanguagesEditController",
            params:{
                language: null
            },
            title: "Language"
        })

        // Admin Components
        .state("admin.components", {
            templateUrl: "views/admin/component/index.html",
            controller: "AdminComponentsController"
        })
        .state("admin.components.generic",{
            templateUrl: "views/admin/component/generic-components/index.html",
            controller: 'AdminGenericComponentsController'
        })
        .state("admin.components.generic.list", {
            templateUrl: "views/admin/component/generic-components/list.html",
            controller: "AdminGenericComponentsListController",
            title: "Generic Components"
        })
        .state("admin.components.generic.edit", {
            templateUrl: "views/admin/component/generic-components/edit.html",
            controller: "AdminGenericComponentsEditController",
            params:{
                component: null,
                stateAction: null
            },
            title: "Generic Components"
        })
        .state("admin.components.static",{
            templateUrl: "views/admin/component/static-components/index.html",
            controller: 'AdminStaticComponentsController'
        })
        .state("admin.components.static.list", {
            templateUrl: "views/admin/component/static-components/list.html",
            controller: "AdminStaticComponentsListController",
            title: "Static Components"
        })
        .state("admin.components.static.edit", {
            templateUrl: "views/admin/component/static-components/edit.html",
            controller: "AdminStaticComponentsEditController",
            params:{
                component: null,
                stateAction: null
            },
            title: "Static Components"
        })
        .state("admin.components.dashboard",{
            templateUrl: "views/admin/component/dashboard-components/index.html",
            controller: 'AdminDashboardComponentsController'
        })
        .state("admin.components.dashboard.list", {
            templateUrl: "views/admin/component/dashboard-components/list.html",
            controller: "AdminDashboardComponentsListController",
            title: "Dashboard Components"
        })
        .state("admin.components.dashboard.edit", {
            templateUrl: "views/admin/component/dashboard-components/edit.html",
            controller: "AdminDashboardComponentsEditController",
            params:{
                component: null,
                stateAction: null,
                redirectTo: null
            },
            title: "Dashboard Components"
        })

        .state("admin.clientdashboard",{
            templateUrl: "views/admin/clientdashboard/dashboard-design.html",
            controller: 'AdminClientDashboardDesignController'
        })
        // Admin Mobile
        .state("admin.mobile",{
            templateUrl: "views/admin/mobile/index.html",
            controller: 'AdminMobileController'
        })
        .state("admin.mobile.sobjects", {
            templateUrl: "views/admin/mobile/sobject/index.html",
            controller: 'AdminMobileSObjectsController'
        })
        .state("admin.mobile.sobjects.list", {
            templateUrl: "views/admin/mobile/sobject/list.html",
            controller: "AdminMobileSObjectsListController",
            title: "SObjects"
        })
        .state("admin.mobile.sobjects.manage", {
            templateUrl: "views/admin/mobile/sobject/manage.html",
            controller: "AdminMobileSObjectsManageController",
            title: "Manage SObjects"
        })
        .state("admin.mobile.sobjects.details", {
            templateUrl: "views/admin/mobile/sobject/details.html",
            controller: "AdminMobileSObjectsDetailsController",
            params:{
                sObject: null
            },
            title: "SObjects details"
        })
        .state("admin.mobile.sobjects.managesobjectfields", {
            templateUrl: "views/admin/mobile/sobjectfields/manage.html",
            controller: "AdminMobileSObjectsFieldsManageController",
            params:{
                sObject: null
            },
            title: "Manage SObjects Fields"
        })
        .state("admin.mobile.governfields", {
            templateUrl: "views/admin/mobile/governfields/index.html",
            controller: 'AdminMobileGovernFieldsController'
        })
        .state("admin.mobile.governfields.list", {
            templateUrl: "views/admin/mobile/governfields/list.html",
            controller: "AdminMobileGovernFieldsListController",
            title: "Govern Fields"
        })
        .state("admin.mobile.governfields.managesobjectgovernfields", {
            templateUrl: "views/admin/mobile/governfields/manage.html",
            controller: "AdminMobileGovernFieldsManageController",
            params:{
                sObject: null
            },
            title: "Manage SObjects Govern Fields"
        })
        .state("admin.mobile.layout", {
            templateUrl: "views/admin/mobile/layout/index.html",
            controller: 'AdminMobileLayoutsController'
        })
        .state("admin.mobile.layout.list", {
            templateUrl: "views/admin/mobile/layout/list.html",
            controller: "AdminMobileLayoutsListController",
            title: "Layout"
        })
        .state("admin.mobile.layout.edit", {
            templateUrl: "views/admin/mobile/layout/edit.html",
            controller: "AdminMobileLayoutsEditController",
            params:{
                layout: null
            },
            title: "Edit Layout"
        })
        .state("admin.mobile.mytask", {
            templateUrl: "views/admin/mobile/mytask/index.html",
            controller: "AdminMobileMyTaskController",
        })
        .state("admin.mobile.mytask.list", {
            templateUrl: "views/admin/mobile/mytask/list.html",
            controller: "AdminMobileMyTaskListController",
            title: "My Task"
        })
        .state("admin.mobile.mytask.edit", {
            templateUrl: "views/admin/mobile/mytask/edit.html",
            controller: "AdminMobileMyTaskEditController",
            params:{
                component: null,
                stateAction: null,
                redirectTo: null
            },
            title: "My Task"
        })
        .state("admin.mobile.useraction", {
            templateUrl: "views/admin/mobile/useraction/index.html",
            controller: 'AdminMobileUserActionController'
        })
        .state("admin.mobile.useraction.list", {
            templateUrl: "views/admin/mobile/useraction/list.html",
            controller: "AdminMobileUserActionListController",
            title: "User Action"
        })
        .state("admin.mobile.useraction.manageuseracitonfields", {
            templateUrl: "views/admin/mobile/useraction/fields.html",
            controller: "AdminMobileUserActionFieldController",
            params:{
                useraction: null
            },
            title: "User Action"
        })
        .state("admin.mobile.picklist", {
            templateUrl: "views/admin/mobile/picklist/index.html",
            controller: 'AdminMobilePicklistController'
        })
        .state("admin.mobile.picklist.list", {
            templateUrl: "views/admin/mobile/picklist/list.html",
            controller: "AdminMobilePicklistListController",
            title: "Picklist"
        })
        .state("admin.mobile.picklist.managechildfieldsvalue", {
            templateUrl: "views/admin/mobile/picklist/fields.html",
            controller: "AdminMobilePicklistFieldController",
            params:{
                picklistDetail: null
            },
            title: "Picklist"
        })
        .state("admin.mobile.orgdetail", {
            templateUrl: "views/admin/mobile/orgdetails/view.html",
            controller: "AdminMobileOrgDetailController",
            title: "Org Details"
        })
        .state("admin.mobile.getConfig", {
            templateUrl: "views/admin/mobile/mobileconfig.html",
            controller: "AdminMobileConfigController",
            params:{
                layout: null
            },
            title: "Mobile Config Layout"
        })
        ;
});