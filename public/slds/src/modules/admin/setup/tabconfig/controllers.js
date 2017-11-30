'use strict';
admin.controller('AdminSetupTabConfigController', ['$scope', '$rootScope', '$state', '$http', 'blockUI', '$dialog', 'tabConfigService',
    function ($scope, $rootScope, $state, $http, blockUI, $dialog, tabConfigService) {
        $scope.loadTabConfigs = function () {
            if (!$scope.blockUI.tabConfigDetail.state().blocking) {
                $scope.blockUI.tabConfigDetail.start('Loading Tab configs...');
                tabConfigService.fetchConfig()
                    .success(function (response) {
                        if (response.success) {
                            $scope.tabConfig = response.data.tabConfig;
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.tabConfigDetail.stop();
                    }).error(function (response) {
                        $dialog.alert('Error occured while loading Tab config.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.tabConfigDetail.stop();
                    });
            }
        };

        $scope.onChangeSave = function (data) {
            if (!$scope.blockUI.tabConfigDetail.state().blocking) {
                $scope.blockUI.tabConfigDetail.start('Saving Tab configs...');
                tabConfigService.save(data)
                    .success(function (response) {
                        $scope.blockUI.tabConfigDetail.stop();
                        if (!response.success) {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                    })
                    .error(function (response) {
                        $scope.blockUI.tabConfigDetail.stop();
                        $dialog.alert('Server error occured while saving data.', 'Error', 'pficon pficon-error-circle-o');
                    });
            }
        };

        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                tabConfigDetail: blockUI.instances.get('tabConfigDetail')
            };
        };
        $scope.init = function () {
            console.log('AdminSetupTabConfigController loaded!');
            $scope.initBlockUiBlocks();
            $scope.loadTabConfigs();
        };
        $scope.init();
    }]);
