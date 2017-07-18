'use strict';

admin.controller('AdminProfileController', [
    '$scope', '$rootScope', '$dialog', 'adminProfileService', 'blockUI', '$state',
    function ($scope, $rootScope, $dialog, adminProfileService, blockUI, $state) {

        $scope.save = function () {
            if ($scope.credentials.password === undefined || $scope.credentials.password === null || $scope.credentials.password === ''
                || $scope.credentials.newPassword === undefined || $scope.credentials.newPassword === null || $scope.credentials.newPassword === '') {
                $dialog.alert('Password field must not be blank', 'Error', 'pficon pficon-error-circle-o');
                return
            }
            if (!(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d][A-Za-z\d!@#$%^&*()_+.]{5,19}$/).test($scope.credentials.newPassword)) {
                $dialog.alert('Password format is invalid', 'Error', 'pficon pficon-error-circle-o');
                return
            }
            if ($scope.credentials.newPassword !== $scope.credentials.confirmPassword) {
                $dialog.alert('Password does not match', 'Error', 'pficon pficon-error-circle-o');
                return;
            }
            if ($scope.credentials.newPassword == $scope.credentials.password) {
                $dialog.alert('Current Password and New Password must not be same', 'Error', 'pficon pficon-error-circle-o');
                return;
            }
            var userObject = $rootScope.user();
            userObject.credentials = $scope.credentials;
            $scope.blockUI.changePasswordLayout.start('Changing password');
            adminProfileService.changepassword(userObject)
                .success(function (response) {
                    $scope.blockUI.changePasswordLayout.stop();
                    if (response.success) {
                        $dialog.alert(response.message, '', '');
                    } else {
                        $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                    }
                })
                .error(function (response) {
                    $scope.blockUI.changePasswordLayout.stop();
                    $dialog.alert('Server error occured while querying lookup data.', 'Error', 'pficon pficon-error-circle-o');
                });

        };

        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                changePasswordLayout: blockUI.instances.get('ChangePasswordLayoutBlock')
            };
        };

        $scope.init = function () {
            console.log('AdminProfileController loaded!');
            $scope.initBlockUiBlocks();
            $scope.credentials = {
                password: null,
                newPassword: null,
                confirmPassword: null
            }
        };
        $scope.init();

    }]);