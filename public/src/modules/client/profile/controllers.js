client.controller('ClientProfileManageController',[
            '$scope','$rootScope','$controller','$stateParams','$state',
    function($scope , $rootScope , $controller , $stateParams , $state){
        var thisCtrl = this;

        $scope.init = function(){
            console.log('ClientProfileManageController loaded!');
            $stateParams.data = {}; $state.current.params={};
            $state.current.params.metadata = $stateParams.metadata;
            $scope.template = 'views/client/layout/edit.html';
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
            if(!(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d][A-Za-z\d!@#$%^&*()_+.]{5,19}$/).test($scope.credentials.newPassword)){ 
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
            '$scope','$rootScope','ClientProfileService','$dialog','$localStorage','blockUI',
    function($scope , $rootScope , ClientProfileService , $dialog , $localStorage , blockUI){

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
        $scope.save = function(){
            if($scope.otherSetting.TimeZoneId === null || $scope.otherSetting.LocaleId === null){
                $dialog.alert('Timezone and locale are mandatory.','Error','pficon pficon-error-circle-o');
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
        };
        $scope.init();
    }
]);