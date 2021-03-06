
'use strict';

admin.config(function($stateProvider) {
    
    $stateProvider
        // Admin root
        .state('admin', {
            parent: 'app',
            templateUrl: 'slds/views/app.admin.html',
            controller: 'AdminController',
        })
         // Admin change password
        .state('admin.changepassword', {
            templateUrl: 'slds/views/admin/profile/changepassword.html',
            controller: 'AdminProfileController',
            title: 'Change Password'
        })
        // Admin change email
        .state('admin.changeemail', {
            templateUrl: 'slds/views/admin/profile/changeemail.html',
            controller: 'AdminProfileEmailController',
            title: 'Change Email'
        })
        // Admin change profile
        .state('admin.changeprofile', {
            templateUrl: 'slds/views/admin/profile/changeprofile.html',
            controller: 'AdminProfileImageController',
            title: 'Change Profile'
        })

        // Admin Dashboard
        .state('admin.dashboard', {
            templateUrl: 'slds/views/admin/dashboard.html',
            controller: 'AdminDashboardController',
            title: 'Dashboard'
        })
        
        // Admin Tabs
        .state("admin.tabs", {
            templateUrl: "slds/views/admin/tab/index.html",
            controller: 'AdminTabsController'
        })
        .state("admin.tabs.list", {
            templateUrl: "slds/views/admin/tab/list.html",
            controller: "AdminTabsListController",
            title: "Tabs"
        })
        .state("admin.tabs.edit", {
            templateUrl: "slds/views/admin/tab/edit.html",
            controller: "AdminTabsEditController",
            params:{
                tab: null
            },
            title: "Tab"
        })
        
        // Admin Layouts
        .state("admin.layouts", {
            templateUrl: "slds/views/admin/layout/index.html",
            controller: 'AdminLayoutsController'
        })
        .state("admin.layouts.list", {
            templateUrl: "slds/views/admin/layout/list.html",
            controller: "AdminLayoutsListController",
            title: "Layouts"
        })
        .state("admin.layouts.edit", {
            templateUrl: "slds/views/admin/layout/edit.html",
            controller: "AdminLayoutsEditController",
            params:{
                layout: null
            },
            title: "Edit Layout"
        })
        
        // Admin Reports
        .state("admin.reports", {
            templateUrl: "slds/views/admin/report/index.html",
            controller: 'AdminReportsController'
        })
        .state("admin.reports.list", {
            templateUrl: "slds/views/admin/report/list.html",
            controller: "AdminReportsListController",
            title: "Reports"
        })
        .state("admin.reports.edit", {
            templateUrl: "slds/views/admin/report/edit.html",
            controller: "AdminReportsEditController",
            params: {
                sObjects: null,
                report: null,
                oper: null
            },
            title: "Edit Report"
        })
        // Admin Custom Lookups
        .state("admin.lookups", {
            templateUrl: "slds/views/admin/lookup/index.html",
            controller: 'AdminLookupsController'
        })
        .state("admin.lookups.list", {
            templateUrl: "slds/views/admin/lookup/list.html",
            controller: "AdminLookupsListController",
            title: "Lookups"
        })
        .state("admin.lookups.edit", {
            templateUrl: "slds/views/admin/lookup/edit.html",
            controller: "AdminLookupsEditController",
            params:{
                lookup: null
            },
            title: "Lookup"
        })

        // Admin User Management
        .state("admin.usermanagement", {
            templateUrl: "slds/views/admin/usermanagement/index.html",
            controller: "AdminUserManagementController"
        })
        .state("admin.usermanagement.users",{
            templateUrl: "slds/views/admin/usermanagement/users/index.html",
            controller: "AdminUserManagementUsersController",
        })
        .state("admin.usermanagement.users.list",{
            templateUrl: "slds/views/admin/usermanagement/users/list.html",
            controller: "AdminUserManagementUsersListController",
            title: "Manage Users"
        })
        .state("admin.usermanagement.users.create",{
            templateUrl: "slds/views/admin/usermanagement/users/create.html",
            controller: "AdminUserManagementUsersCreateController",
            params:{
                userData: null,
                userMapping: null
            },
            title: "Create Users"
        })
        .state("admin.usermanagement.users.edit",{
            templateUrl: "slds/views/admin/usermanagement/users/edit.html",
            controller: "AdminUserManagementUsersEditController",
            params:{
                userData: null,
                userMapping: null
            },
            title: "Edit Users"
        })
        .state("admin.usermanagement.profile",{
            templateUrl: "slds/views/admin/usermanagement/profile/userprofilelayout.html",
            controller: "AdminUserManagementUsersProfileController",
            title: "Manage Profile Layout"
        })
        .state("admin.usermanagement.createlayout",{
            templateUrl: "slds/views/admin/usermanagement/userlayout/userlayout.html",
            controller: "AdminUserManageUsersLayoutController",
            title: "Manage User Layout"
        })
        .state("admin.usermanagement.bulkuploadconfig",{
            templateUrl: "slds/views/admin/usermanagement/bulkuploadconfig/index.html",
            controller: "AdminUserManageBulkUploadConfigController",
            title: "Bulk User Upload Config"
        })
        .state("admin.usermanagement.bulkupload",{
            templateUrl: "slds/views/admin/usermanagement/bulkupload/upload.html",
            controller: "AdminUserManageBulkUploadController",
            title: "Bulk User Upload"
        })
        .state("admin.usermanagement.roles",{
            templateUrl: "slds/views/admin/usermanagement/roles/index.html",
            controller: "AdminUserManagementRolesController",
        })
        .state("admin.usermanagement.roles.list",{
            templateUrl: "slds/views/admin/usermanagement/roles/list.html",
            controller: "AdminUserManagementRolesListController",
            title: "Manage Roles"
        })

        // Admin Setup Routes
        .state("admin.setup", {
            templateUrl: "slds/views/admin/setup/index.html",
            controller: "AdminSetupController"
        })
        .state("admin.setup.sfdc",{
            templateUrl: "slds/views/admin/setup/sfdc/view.html",
            controller: "AdminSetupSfdcController",
            title: "Salesforce Org"
        })
        //Admin Archival Routes
        .state("admin.archival", {
            templateUrl: "slds/views/admin/archival/index.html",
            controller: "AdminArchivalController"
        })
        //-- SOBJECTS SETUP
        .state("admin.setup.sobjects", {
            templateUrl: "slds/views/admin/setup/sobject/index.html",
            controller: 'AdminSetupSObjectsController'
        })
        .state("admin.setup.sobjects.list", {
            templateUrl: "slds/views/admin/setup/sobject/list.html",
            controller: "AdminSetupSObjectsListController",
            title: "SObjects"
        })
        .state("admin.setup.sobjects.manage", {
            templateUrl: "slds/views/admin/setup/sobject/manage.html",
            controller: "AdminSetupSObjectsManageController",
            title: "Manage SObjects"
        })
        .state("admin.setup.sobjects.details", {
            templateUrl: "slds/views/admin/setup/sobject/details.html",
            controller: "AdminSetupSObjectsDetailsController",
            params:{
                sObject: null
            },
            title: "SObjects details"
        })
        

        //-- LAYOUTS ARCHIVAL
        .state("admin.archival.layouts", {
            templateUrl: "slds/views/admin/archival/layouts/index.html",
            controller: 'AdminArchivalLayoutsController'
        })
        .state("admin.archival.layouts.list", {
            templateUrl: "slds/views/admin/archival/layouts/list.html",
            controller: "AdminArchivalLayoutsListController",
            title: "SObjects"
        })   
        .state("admin.archival.layouts.edit", {
            templateUrl: "slds/views/admin/archival/layouts/edit.html",
            controller: "AdminArchivalLayoutsEditController",
            params:{
                layout: null
            },
            title: "Edit Layout"
        })
        //-- USER MAPPING SETUP
        .state("admin.setup.usermapping",{
            templateUrl: "slds/views/admin/setup/usermapping/view.html",
            controller: "AdminSetupUserMappingController",
            title: "User Mapping"
        })
        .state("admin.setup.ssoconfig",{
            templateUrl: "slds/views/admin/setup/ssoconfig/view.html",
            controller: "AdminSetupSSOConfigController",
            title: "SSO Configuration"
        })
        .state("admin.setup.logoconfig",{
            templateUrl: "slds/views/admin/setup/logoconfig/view.html",
            controller: "AdminSetupLogoConfigController",
            title: "Logo Configuration"
        })
        .state("admin.setup.tabconfig",{
            templateUrl: "slds/views/admin/setup/tabconfig/view.html",
            controller: "AdminSetupTabConfigController",
            title: "Tab Configuration"
        })
        //-- TemplateConfiguration
        .state("admin.setup.templateconfiguration", {
            templateUrl: "slds/views/admin/setup/templateconfig/index.html",
            controller: "AdminSetupTemplateConfigController"
        })
        .state("admin.setup.templateconfiguration.list", {
            templateUrl: "slds/views/admin/setup/templateconfig/list.html",
            controller: "AdminSetupTemplateConfigListController",
            title: "Template Configuration"
        })
        .state("admin.setup.templateconfiguration.edit", {
            templateUrl: "slds/views/admin/setup/templateconfig/edit.html",
            controller: "AdminSetupTemplateConfigEditController",
            params: {
                template: null,
                utilityName: null,
                emailType: null
            },
            title: "Template"
        })
        // Admin Languages
        .state("admin.languages",{
            templateUrl: "slds/views/admin/language/index.html",
            controller: 'AdminLanguagesController'
        })
        .state("admin.languages.list", {
            templateUrl: "slds/views/admin/language/list.html",
            controller: "AdminLanguagesListController",
            title: "Languages"
        })
        .state("admin.languages.edit", {
            templateUrl: "slds/views/admin/language/edit.html",
            controller: "AdminLanguagesEditController",
            params:{
                language: null
            },
            title: "Language"
        })

        // Admin Components
        .state("admin.components", {
            templateUrl: "slds/views/admin/component/index.html",
            controller: "AdminComponentsController"
        })
        .state("admin.components.generic",{
            templateUrl: "slds/views/admin/component/generic-components/index.html",
            controller: 'AdminGenericComponentsController'
        })
        .state("admin.components.generic.list", {
            templateUrl: "slds/views/admin/component/generic-components/list.html",
            controller: "AdminGenericComponentsListController",
            title: "Generic Components"
        })
        .state("admin.components.generic.edit", {
            templateUrl: "slds/views/admin/component/generic-components/edit.html",
            controller: "AdminGenericComponentsEditController",
            params:{
                component: null,
                stateAction: null
            },
            title: "Generic Components"
        })
        .state("admin.components.static",{
            templateUrl: "slds/views/admin/component/static-components/index.html",
            controller: 'AdminStaticComponentsController'
        })
        .state("admin.components.static.list", {
            templateUrl: "slds/views/admin/component/static-components/list.html",
            controller: "AdminStaticComponentsListController",
            title: "Static Components"
        })
        .state("admin.components.static.edit", {
            templateUrl: "slds/views/admin/component/static-components/edit.html",
            controller: "AdminStaticComponentsEditController",
            params:{
                component: null,
                stateAction: null
            },
            title: "Static Components"
        })
        .state("admin.components.dashboard",{
            templateUrl: "slds/views/admin/component/dashboard-components/index.html",
            controller: 'AdminDashboardComponentsController'
        })
        .state("admin.components.dashboard.list", {
            templateUrl: "slds/views/admin/component/dashboard-components/list.html",
            controller: "AdminDashboardComponentsListController",
            title: "Dashboard Components"
        })
        .state("admin.components.dashboard.edit", {
            templateUrl: "slds/views/admin/component/dashboard-components/edit.html",
            controller: "AdminDashboardComponentsEditController",
            params:{
                component: null,
                stateAction: null,
                redirectTo: null
            },
            title: "Dashboard Components"
        })

        // Bulk Creation Config
        .state("admin.bulkcreationconfig", {
            templateUrl: "slds/views/admin/bulkcreationconfig/index.html",
            controller: "AdminBulkCreationConfigController",
            title: "Bulk Creation Config"
        })
        .state("admin.clientdashboard",{
            templateUrl: "slds/views/admin/clientdashboard/dashboard-design.html",
            controller: 'AdminClientDashboardDesignController'
        })
        // Admin Mobile
        .state("admin.mobile",{
            templateUrl: "slds/views/admin/mobile/index.html",
            controller: 'AdminMobileController'
        })
        .state("admin.mobile.sobjects", {
            templateUrl: "slds/views/admin/mobile/sobject/index.html",
            controller: 'AdminMobileSObjectsController'
        })
        .state("admin.mobile.sobjects.list", {
            templateUrl: "slds/views/admin/mobile/sobject/list.html",
            controller: "AdminMobileSObjectsListController",
            title: "SObjects"
        })
        .state("admin.mobile.sobjects.manage", {
            templateUrl: "slds/views/admin/mobile/sobject/manage.html",
            controller: "AdminMobileSObjectsManageController",
            title: "Manage SObjects"
        })
        .state("admin.mobile.sobjects.details", {
            templateUrl: "slds/views/admin/mobile/sobject/details.html",
            controller: "AdminMobileSObjectsDetailsController",
            params:{
                sObject: null
            },
            title: "SObjects details"
        })
        .state("admin.mobile.sobjects.managesobjectfields", {
            templateUrl: "slds/views/admin/mobile/sobjectfields/manage.html",
            controller: "AdminMobileSObjectsFieldsManageController",
            params:{
                sObject: null
            },
            title: "Manage SObjects Fields"
        })
        .state("admin.mobile.governfields", {
            templateUrl: "slds/views/admin/mobile/governfields/index.html",
            controller: 'AdminMobileGovernFieldsController'
        })
        .state("admin.mobile.governfields.list", {
            templateUrl: "slds/views/admin/mobile/governfields/list.html",
            controller: "AdminMobileGovernFieldsListController",
            title: "Govern Fields"
        })
        .state("admin.mobile.governfields.managesobjectgovernfields", {
            templateUrl: "slds/views/admin/mobile/governfields/manage.html",
            controller: "AdminMobileGovernFieldsManageController",
            params:{
                sObject: null
            },
            title: "Manage SObjects Govern Fields"
        })
        .state("admin.mobile.layout", {
            templateUrl: "slds/views/admin/mobile/layout/index.html",
            controller: 'AdminMobileLayoutsController'
        })
        .state("admin.mobile.layout.list", {
            templateUrl: "slds/views/admin/mobile/layout/list.html",
            controller: "AdminMobileLayoutsListController",
            title: "Layout"
        })
        .state("admin.mobile.layout.create", {
            templateUrl: "slds/views/admin/mobile/layout/create.html",
            controller: "AdminMobileLayoutsCreateController",
            params:{
                layout: null
            },
            title: "Create Layout"
        })
        .state("admin.mobile.layout.edit", {
            templateUrl: "slds/views/admin/mobile/layout/edit.html",
            controller: "AdminMobileLayoutsEditController",
            params:{
                layout: null
            },
            title: "Edit Layout"
        })
        .state("admin.mobile.mytask", {
            templateUrl: "slds/views/admin/mobile/mytask/index.html",
            controller: "AdminMobileMyTaskController",
        })
        .state("admin.mobile.mytask.list", {
            templateUrl: "slds/views/admin/mobile/mytask/list.html",
            controller: "AdminMobileMyTaskListController",
            title: "My Task"
        })
        .state("admin.mobile.mytask.edit", {
            templateUrl: "slds/views/admin/mobile/mytask/edit.html",
            controller: "AdminMobileMyTaskEditController",
            params:{
                component: null,
                stateAction: null,
                redirectTo: null
            },
            title: "My Task"
        })
        .state("admin.mobile.useraction", {
            templateUrl: "slds/views/admin/mobile/useraction/index.html",
            controller: 'AdminMobileUserActionController'
        })
        .state("admin.mobile.useraction.list", {
            templateUrl: "slds/views/admin/mobile/useraction/list.html",
            controller: "AdminMobileUserActionListController",
            title: "User Action"
        })
        .state("admin.mobile.useraction.manageuseracitonfields", {
            templateUrl: "slds/views/admin/mobile/useraction/fields.html",
            controller: "AdminMobileUserActionFieldController",
            params:{
                useraction: null
            },
            title: "User Action"
        })
        .state("admin.mobile.picklist", {
            templateUrl: "slds/views/admin/mobile/picklist/index.html",
            controller: 'AdminMobilePicklistController'
        })
        .state("admin.mobile.picklist.list", {
            templateUrl: "slds/views/admin/mobile/picklist/list.html",
            controller: "AdminMobilePicklistListController",
            title: "Picklist"
        })
        .state("admin.mobile.picklist.managechildfieldsvalue", {
            templateUrl: "slds/views/admin/mobile/picklist/fields.html",
            controller: "AdminMobilePicklistFieldController",
            params:{
                picklistDetail: null
            },
            title: "Picklist"
        })
        .state("admin.mobile.orgdetail", {
            templateUrl: "slds/views/admin/mobile/orgdetails/view.html",
            controller: "AdminMobileOrgDetailController",
            title: "Org Details"
        })
        .state("admin.mobile.getConfig", {
            templateUrl: "slds/views/admin/mobile/mobileconfig.html",
            controller: "AdminMobileConfigController",
            params:{
                layout: null
            },
            title: "Mobile Config Layout"
        })
        .state("admin.mobile.unlockmobusers", {
            templateUrl: "slds/views/admin/mobile/unlockmobusers/list.html",
            controller: "AdminUnlockMobUsersController",
            title: "Unlock Mobile Users"
        })
        .state("admin.mobile.ssoconfig", {
            templateUrl: "slds/views/admin/mobile/ssoconfig/view.html",
            controller: "AdminMobileSSOConfigController",
            title: "SSO Config Layout"
        })
        ;
});