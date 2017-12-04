'use strict';

admin.controller('AdminProfileController', [
    '$scope', '$rootScope', '$dialog', 'adminProfileService', 'blockUI', '$state',
    function ($scope, $rootScope, $dialog, adminProfileService, blockUI, $state) {

        $scope.save = function () {
            if ($scope.credentials.password === undefined || $scope.credentials.password === null || $scope.credentials.password === ''
                || $scope.credentials.newPassword === undefined || $scope.credentials.newPassword === null || $scope.credentials.newPassword === '') {
                $dialog.alert('Password field must not be blank', 'Error', 'pficon pficon-error-circle-o');
                return;
            }
            if (!(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+.]{5,19}$/).test($scope.credentials.newPassword)) {
                $dialog.alert('Password format is invalid', 'Error', 'pficon pficon-error-circle-o');
                return;
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
                    $dialog.alert('Server error occured while saving data.', 'Error', 'pficon pficon-error-circle-o');
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

admin.controller('AdminProfileEmailController', [
    '$scope', '$rootScope', '$dialog', 'adminProfileService', 'blockUI', '$state',
    function ($scope, $rootScope, $dialog, adminProfileService, blockUI, $state) {

        $scope.saveEmail = function () {
            if ($scope.user.newEmail === undefined || $scope.user.newEmail === null || $scope.user.newEmail === '') {
                $dialog.alert('Please enter email address', 'Error', 'pficon pficon-error-circle-o');
                return;
            }
            if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/).test($scope.user.newEmail)) {
                $dialog.alert('Please enter valid email address', 'Error', 'pficon pficon-error-circle-o');
                return;
            }
            var userObject = $rootScope.user();
            userObject.newEmail = $scope.user.newEmail;
            $scope.blockUI.changeEmailLayout.start('Changing Email');
            adminProfileService.changeemail(userObject)
                .success(function (response) {
                    $scope.blockUI.changeEmailLayout.stop();
                    if (response.success) {
                        userObject.email = userObject.newEmail;
                        delete userObject.newEmail;
                        $rootScope.updateUserLanguage(userObject);
                        $scope.currentemail = $rootScope.user().email;
                        $scope.user.newEmail = undefined;
                        $dialog.alert(response.message, '', '');
                    } else {
                        $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                    }
                })
                .error(function (response) {
                    $scope.blockUI.changeEmailLayout.stop();
                    $dialog.alert('Server error occured while saving data.', 'Error', 'pficon pficon-error-circle-o');
                });

        };

        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                changeEmailLayout: blockUI.instances.get('ChangeEmailLayoutBlock')
            };
        };

        $scope.init = function () {
            console.log('AdminProfileEmailController loaded!');
            $scope.initBlockUiBlocks();
            $scope.currentemail = $rootScope.user().email;
        };
        $scope.init();

    }
]);

admin.controller('AdminProfileImageController', [
    '$scope', '$rootScope', '$dialog', 'ClientProfileService', 'blockUI', 'Upload',
    function ($scope, $rootScope, $dialog, ClientProfileService, blockUI, Upload) {

        $scope.getUserProfileImg = function () {
            $scope.blockUI.ChangeProfileImgLayoutBlock.start('Loading profile image...');
            ClientProfileService.getUserProfileImg({ Id: 'Admin' })
                .success(function (response) {
                    $scope.blockUI.ChangeProfileImgLayoutBlock.stop();
                    if (response.success) {
                        $scope.userProfileImg = response.path + '?tls=';
                        $scope.tempUserProfileImg = $scope.userProfileImg;
                    }
                    else {
                        $scope.userProfileImg = '/resources/images/profiles/userAvatar.jpg?tls=';
                    }
                })
                .error(function () {
                    $scope.blockUI.ChangeProfileImgLayoutBlock.stop();
                    $scope.userProfileImg = '/resources/images/profiles/userAvatar.jpg?tls=';
                });
        };

        $scope.onChangeImg = function (changeVal) {
            $scope.select.defaultAvatar1 = false;
            $scope.select.defaultAvatar2 = false;
            $scope.select.defaultAvatar3 = false;
            $scope.select.userAvatar = false;
            $scope.select[changeVal] = true;

            if (changeVal == 'defaultAvatar1' || changeVal == 'defaultAvatar2' || changeVal == 'defaultAvatar3') {
                $scope.select.userAvatarChecked = true;
                $scope.blockUI.ChangeProfileImgLayoutBlock.start('Updating profile image...');
                var avatarName = '';
                if (changeVal == 'defaultAvatar1') {
                    avatarName = 'avatar1';
                }
                else if (changeVal == 'defaultAvatar2') {
                    avatarName = 'avatar2';
                }
                else if (changeVal == 'defaultAvatar3') {
                    avatarName = 'avatar3';
                }
                ClientProfileService.setAvatarForUser({ Id: 'Admin', avatar: avatarName })
                    .success(function (response) {
                        $scope.blockUI.ChangeProfileImgLayoutBlock.stop();
                        if (response.success) {
                            $scope.userProfileImg = response.path + '?tls=';
                            $scope.tempUserProfileImg = $scope.userProfileImg + new Date().getTime();
                        }
                        else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                    })
                    .error(function () {
                        $scope.blockUI.ChangeProfileImgLayoutBlock.stop();
                        $dialog.alert('Server error occured while updating profile image.', 'Error', 'pficon pficon-error-circle-o');
                    });
            }
            else {
                $scope.select.userAvatarChecked = false;
            }
        };

        $scope.selectFile = function (files, errFiles) {
            var file = undefined;
            if (files.length > 0) {
                file = files[0];
            }
            if (file != undefined && (($scope.allowedExtList.indexOf(file.name.toLowerCase().substr(file.name.lastIndexOf("."), file.name.length - 1)) > -1))) {
                if (file.size > 102400) {
                    $dialog.alert('Maximum 100 KB file size is allowed.', 'Error', 'pficon pficon-error-circle-o');
                }
                else {
                    if (!$scope.blockUI.ChangeProfileImgLayoutBlock.state().blocking) {
                        $scope.blockUI.ChangeProfileImgLayoutBlock.start('Uploading User Profile Image...');
                        Upload.upload({
                            url: '/api/service/profile/userProfileImgconfig',
                            data: { file: file }
                        }).then(function (response) {
                            if (response.data.success) {
                                $scope.blockUI.ChangeProfileImgLayoutBlock.stop();
                                $scope.tempUserProfileImg = $scope.userProfileImg + new Date().getTime();
                            }
                            else {
                                $dialog.alert(file.name + ' upload failed.', 'Error', 'pficon pficon-error-circle-o');
                            }
                        });
                    }
                }
            }
            else if (file != undefined) {
                $dialog.alert('Only ' + $scope.allowedExtList + ' file format supported.', 'Error', 'pficon pficon-error-circle-o');
            }
        };

        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                ChangeProfileImgLayoutBlock: blockUI.instances.get('ChangeProfileImgLayoutBlock')
            };
        };
        $scope.init = function () {
            console.log('AdminProfileImageController loaded!');
            $scope.initBlockUiBlocks();
            $scope.allowedExtList = ".jpg";
            $scope.allowedExt = $scope.allowedExtList.split(',');
            $scope.userProfileImg = '/resources/images/profiles/userAvatar.jpg?tls=';
            $scope.tempUserProfileImg = $scope.userProfileImg;
            $scope.select = {};
            $scope.select.defaultAvatar1 = false;
            $scope.select.defaultAvatar2 = false;
            $scope.select.defaultAvatar3 = false;
            $scope.select.userAvatar = false;
            $scope.select.userAvatarChecked = true;
            $scope.getUserProfileImg();
        };
        $scope.init();
    }
]);