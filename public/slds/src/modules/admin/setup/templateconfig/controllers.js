'use strict';

admin.controller('AdminSetupTemplateConfigController', ['$scope', '$rootScope', '$state', function ($scope, $rootScope, $state) {
    $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams, options) {
        if (toState.name === 'admin.setup.templateconfiguration' && fromState !== 'admin.setup.templateconfiguration.list') {
            event.preventDefault();
            $state.go('admin.setup.templateconfiguration.list');
        }
    });
    $scope.init = function () {
        console.log('AdminSetupTemplateConfigController loaded!');
        $state.go('admin.setup.templateconfiguration.list');
    };
    $scope.init();
}]);

admin.controller('AdminSetupTemplateConfigListController', [
    '$scope', '$state', '$stateParams', 'templateConfigService', 'blockUI', '$dialog', '$adminModals',
    function ($scope, $state, $stateParams, templateConfigService, blockUI, $dialog, $adminModals) {
        $scope.loadTemplates = function () {
            if (!$scope.blockUI.loadTemplates.state().blocking) {
                $scope.blockUI.loadTemplates.start('Loading Templates...');
                templateConfigService.loadTemplates({})
                    .success(function (response) {
                        if (response.success) {
                            $scope.sTemplates = response.data.sTemplates;
                            $scope.utilityName = response.data.utilityName;
                            $scope.emailType = response.data.emailType;
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.loadTemplates.stop();
                    })
                    .error(function (response) {
                        $dialog.alert('Error occured while loading templates.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.loadTemplates.stop();
                    });
            }
        };

        $scope.deleteTemplate = function (template) {
            $dialog.confirm({
                title: 'Confirm delete ?',
                yes: 'Yes, Delete', no: 'Cancel',
                message: 'Are you sure to delete "' + template.utilityname + '' + template.Language.name + '" template ?',
                class: 'destructive',
                headerClass: 'error'
            }, function (confirm) {
                if (confirm) {
                    $scope.blockUI.loadTemplates.start('Deleting "' + template.utilityname + '' + template.Language.name + '" template...');
                    templateConfigService.deleteTemplate(template)
                        .success(function (response) {
                            $scope.blockUI.loadTemplates.stop();
                            if (response.success) {
                                $scope.loadTemplates();
                            } else {
                                $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                            }
                        })
                        .error(function (response) {
                            $scope.blockUI.loadTemplates.stop();
                            $dialog.alert('Error occured while deleting tab.', 'Error', 'pficon pficon-error-circle-o');
                        });
                }
            });
        };
        $scope.edit = function (template) {
            $state.go('admin.setup.templateconfiguration.edit', { template: template, utilityName: $scope.utilityName, emailType: $scope.emailType });
        };
        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                loadTemplates: blockUI.instances.get('loadTemplates')
            };
        };

        $scope.init = function () {
            console.log('AdminSetupTemplateConfigListController loaded!');
            $scope.initBlockUiBlocks();
            $scope.loadTemplates();
        };
        $scope.init();
    }]);

admin.controller('AdminSetupTemplateConfigEditController', [
    '$scope', '$state', '$stateParams', 'templateConfigService', 'blockUI', '$dialog', '$adminModals',
    function ($scope, $state, $stateParams, templateConfigService, blockUI, $dialog, $adminModals) {
        $scope.save = function () {
            if ($scope.sTemplates.utilityname == undefined || $scope.sTemplates.utilityname == null || $scope.sTemplates.utilityname == "") {
                $dialog.alert("Please Select utility Name", 'Error', 'pficon pficon-error-circle-o');
            }
            else if ($scope.sTemplates.Language == undefined || $scope.sTemplates.Language == null || $scope.sTemplates.Language == "") {
                $dialog.alert("Please Select Language Name", 'Error', 'pficon pficon-error-circle-o');
            }
            else if ($scope.sTemplates.subject == undefined || $scope.sTemplates.subject == null || $scope.sTemplates.subject == "") {
                $dialog.alert("Please Enter Subject", 'Error', 'pficon pficon-error-circle-o');
            }
            else if ($scope.sTemplates.body == undefined || $scope.sTemplates.body == null || $scope.sTemplates.body == "") {
                $dialog.alert("Please Enter Body", 'Error', 'pficon pficon-error-circle-o');
            }
            else if ($scope.sTemplates.emailtype == undefined || $scope.sTemplates.emailtype == null || $scope.sTemplates.emailtype == "") {
                $dialog.alert("Please Select Email Type", 'Error', 'pficon pficon-error-circle-o');
            }
            else{
            if (!$scope.blockUI.editTemplate.state().blocking) {
                var templateToSave = angular.copy($scope.sTemplates);
                templateToSave.subject = templateToSave.subject;
                templateToSave.body = templateToSave.body;
                templateToSave.emailtype = templateToSave.emailtype;
                templateToSave.active = templateToSave.active;
                if (templateToSave.Language != undefined && templateToSave.Language.id !== undefined && templateToSave.Language.id !== null) {
                    templateToSave.Language = templateToSave.Language.id;
                }
                
                $scope.blockUI.editTemplate.start('Saving template...');
                templateConfigService.saveTemplate($scope.sTemplates)
                    .success(function (response) {
                        if (response.success === true) {
                            $scope.sTemplates = response.data.templateToSave;
                             $scope.sTemplates = response.data.templateToSave;
                            $scope.returnToList();
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.editTemplate.stop();
                    })
                    .error(function (response) {
                        $dialog.alert('Error occured while saving user template.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.editTemplate.stop();
                    });
            }
        }
        }
        $scope.loadLanguages = function () {
            if (!$scope.blockUI.editTemplate.state().blocking) {
                $scope.blockUI.editTemplate.start('Loading languages...');
                templateConfigService.loadLanguages()
                    .success(function (response) {
                        if (response.success) {
                            $scope.languages = response.data.languages;
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.editTemplate.stop();
                    })
                    .error(function (response) {
                        $dialog.alert('Error occured while loading languages.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.editTemplate.stop();
                    });
            }
        };
        $scope.returnToList = function () {
            $state.go('admin.setup.templateconfiguration.list');
        };

        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                editTemplate: blockUI.instances.get('editTemplate')
            };
        };
        $scope.init = function () {
            console.log('AdminSetupTemplateConfigEditController loaded!');
            $scope.stateAction = ($stateParams.template) ? 'Edit' : 'Create';
            $scope.utilityName = $stateParams.utilityName;
            $scope.emailType = $stateParams.emailType;
            $scope.sTemplates = $stateParams.template;
            if ($scope.sTemplates === null || $scope.sTemplates === undefined) {
                $scope.sTemplates = {};
            }
            $scope.initBlockUiBlocks();
            $scope.loadLanguages();
        };
        $scope.init();
    }]);
