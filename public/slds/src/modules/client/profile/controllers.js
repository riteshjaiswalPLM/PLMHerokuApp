client.controller('ClientProfileManageController',[
            '$scope','$rootScope','$controller','$stateParams','$state',
    function($scope , $rootScope , $controller , $stateParams , $state){
        var thisCtrl = this;

        $scope.init = function(){
            console.log('ClientProfileManageController loaded!');
            $stateParams.metadata.redirectTo="client.profile";
            $stateParams.data = {}; $state.current.params={};
            $state.current.params.metadata = $stateParams.metadata;
            $scope.template = 'slds/views/client/layout/edit.html';
            $scope.icon = 'settings';
            var rootUser= JSON.parse($rootScope.user().userdata);
            $stateParams.data['record'] = {
                Id: rootUser.Id,
                Name: rootUser.Name,
                attributes: {
                    type: $stateParams.metadata.sobject.name,
                    url: "/services/data/v37.0/sobjects/"+$stateParams.metadata.sobject.name+"/"+rootUser.Id
                }
            };
            $scope.hideHeader = true;
            angular.extend(thisCtrl, $controller('ClientSectionLayoutController', {$scope: $scope, $stateParams: $stateParams}));
        };

        $scope.init();
    }
]);

client.controller('ClientProfileChangePasswordController',[
            '$scope','$rootScope','$dialog','ClientProfileService','blockUI','$state',
    function($scope , $rootScope , $dialog , ClientProfileService , blockUI,$state){

        $scope.save = function(){
            if($scope.credentials.password === undefined || $scope.credentials.password ===null || $scope.credentials.password === ''
                || $scope.credentials.newPassword === undefined || $scope.credentials.newPassword ===null || $scope.credentials.newPassword === ''  ){
                $dialog.alert('Password field must not be blank','Error','pficon pficon-error-circle-o');
                return
            }
            if(!(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+.]{5,19}$/).test($scope.credentials.newPassword)){ 
                $dialog.alert('Password format is invalid','Error','pficon pficon-error-circle-o');
                return
            }
            if($scope.credentials.newPassword !== $scope.credentials.confirmPassword)
            {
                $dialog.alert('Password Does not Match','Error','pficon pficon-error-circle-o');
                return;
            }
            if($scope.credentials.newPassword == $scope.credentials.password)
            {
                $dialog.alert('Current Password and New Password must not be same','Error','pficon pficon-error-circle-o');
                return;
            }
            var userObject = $rootScope.user();
            userObject.credentials = $scope.credentials;
            $scope.blockUI.changePasswordLayout.start('Changing password');
            ClientProfileService.changepassword(userObject)
                .success(function(response){
                    $scope.blockUI.changePasswordLayout.stop();
                    if(response.success){
                        $dialog.alert(response.message,'','');
                        $state.go('client.profile');
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                })
                .error(function(response){
                    $scope.blockUI.changePasswordLayout.stop();
                    $dialog.alert('Server error occured while querying lookup data.','Error','pficon pficon-error-circle-o');
                });
           
        };
        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                changePasswordLayout: blockUI.instances.get('ChangePasswordLayoutBlock')
            };
        };
        $scope.init = function(){
            console.log('ResetPasswordController loaded!');
            $scope.initBlockUiBlocks();
            $scope.credentials={
                password        :null,
                newPassword     :null,
                confirmPassword :null
            }
        };
        $scope.init();
    }
]);

client.controller('ClientProfileOtherController',[
            '$scope','$rootScope','ClientProfileService','$dialog','$localStorage','blockUI','Upload',
    function($scope , $rootScope , ClientProfileService , $dialog , $localStorage , blockUI , Upload){

        $scope.loadStaticList = function(){
            $scope.blockUI.manageProfileOtherSettings.start('Loading available static lists...');
            ClientProfileService.loadstaticlist()
                .success(function(response){
                    $scope.blockUI.manageProfileOtherSettings.stop();
                    if(response.success){
                        $scope.languagelist = response.data.languagelist;
                        $scope.timezones = response.data.timezone;
                        $scope.locales = response.data.locale;
                    }
                    else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                })
                .error(function(){
                    $scope.blockUI.manageProfileOtherSettings.stop();
                    $dialog.alert('Server error occured while querying lookup data.','Error','pficon pficon-error-circle-o');
                });
        };

        $scope.getUserProfileImg = function () {
            $scope.blockUI.manageProfileOtherSettings.start('Loading profile image...');
            ClientProfileService.getUserProfileImg({ Id: $scope.userData.Id })
                .success(function (response) {
                    $scope.blockUI.manageProfileOtherSettings.stop();
                    if (response.success) {
                        $scope.userProfileImg = response.path + '?tls=';
                        $scope.tempUserProfileImg = $scope.userProfileImg;
                    }
                    else {
                        $scope.userProfileImg = '/resources/images/profiles/userAvatar.jpg?tls=';
                    }
                })
                .error(function () {
                    $scope.blockUI.manageProfileOtherSettings.stop();
                    $scope.userProfileImg = '/resources/images/profiles/userAvatar.jpg?tls=';
                });
        };

        $scope.save = function(){
            if($scope.otherSetting.Language === null ){
                $dialog.alert('Language is mandatory.','Validation Alert','pficon-warning-triangle-o');
                return;
            }
            if($scope.otherSetting.TimeZoneId === null || $scope.otherSetting.LocaleId === null){
                $dialog.alert('Timezone and locale are mandatory.','Validation Alert','pficon-warning-triangle-o');
                return;
            }
            $scope.blockUI.manageProfileOtherSettings.start('Saving...');
            ClientProfileService.saveothersettings($scope.otherSetting)
                .success(function(response){
                    $scope.blockUI.manageProfileOtherSettings.stop();
                    if(response.success){
                        $scope.otherSetting.user.Language = angular.copy($scope.otherSetting.Language);
                        $scope.otherSetting.user.LocaleId = $scope.otherSetting.LocaleId;
                        $scope.otherSetting.user.TimeZoneId = $scope.otherSetting.TimeZoneId;
                        $scope.timezones.forEach(function(timezone){
                            if(timezone.id === $scope.otherSetting.user.TimeZoneId) $scope.otherSetting.user.TimeZone = timezone;
                        });
                        $scope.locales.forEach(function(locale){
                            if(locale.id === $scope.otherSetting.user.LocaleId) $scope.otherSetting.user.Locale = locale;
                        });
                        $rootScope.updateUserLanguage($scope.otherSetting.user);
                        $localStorage.translations = response.translations
                        $rootScope.configureLanguages();
                        $dialog.alert(response.message,'','');
                    }
                    else{
                        $scope.blockUI.manageProfileOtherSettings.stop();s
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                })
                .error(function(){
                    $dialog.alert('Server error occured while querying lookup data.','Error','pficon pficon-error-circle-o');
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
                $scope.blockUI.manageProfileOtherSettings.start('Updating profile image...');
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
                ClientProfileService.setAvatarForUser({ Id: $scope.userData.Id, avatar: avatarName })
                    .success(function (response) {
                        $scope.blockUI.manageProfileOtherSettings.stop();
                        if (response.success) {
                            $scope.userProfileImg = response.path + '?tls=';
                            $scope.tempUserProfileImg = $scope.userProfileImg + new Date().getTime();
                        }
                        else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                    })
                    .error(function () {
                        $scope.blockUI.manageProfileOtherSettings.stop();
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
                    if (!$scope.blockUI.manageProfileOtherSettings.state().blocking) {
                        $scope.blockUI.manageProfileOtherSettings.start('Uploading User Profile Image...');
                        Upload.upload({
                            url: '/api/service/profile/userProfileImgconfig',
                            data: { file: file }
                        }).then(function (response) {
                            $scope.blockUI.manageProfileOtherSettings.stop();
                            if (response.data.success) {
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

        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                manageProfileOtherSettings: blockUI.instances.get('manageProfileOtherSettingsBlockLayout')
            };
        };
        $scope.init = function(){
            console.log('ClientProfileOtherController loaded!');
            $scope.initBlockUiBlocks();
            $scope.otherSetting = {};
            $scope.otherSetting.user = $rootScope.user();
            $scope.otherSetting.Language = angular.copy($scope.otherSetting.user.Language);
            $scope.otherSetting.LocaleId = $scope.otherSetting.user.LocaleId;
            $scope.otherSetting.TimeZoneId = $scope.otherSetting.user.TimeZoneId;
            $scope.loadStaticList();
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
            $scope.userData = JSON.parse($rootScope.user().userdata);
            $scope.getUserProfileImg();
        };
        $scope.init();
    }
]);