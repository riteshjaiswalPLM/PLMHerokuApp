client.controller('ClientProfileManageController',[
            '$scope','$rootScope','$controller','$stateParams','$state',
    function($scope , $rootScope , $controller , $stateParams , $state){
        var thisCtrl = this;

        $scope.init = function(){
            console.log('ClientProfileManageController loaded!');
            $stateParams.data = {}; $state.current.params={};
            $state.current.params.metadata = $stateParams.metadata;
            $scope.template = 'slds/views/client/layout/edit.html';
            $stateParams.data['record'] = {
                Id: $rootScope.user().userdata.Id,
                Name: $rootScope.user().userdata.Name,
                attributes: {
                    type: $stateParams.metadata.sobject.name,
                    url: "/services/data/v37.0/sobjects/"+$stateParams.metadata.sobject.name+"/"+$rootScope.user().userdata.Id
                }
            };
            $scope.hideHeader = true;
            angular.extend(thisCtrl, $controller('ClientSectionLayoutController', {$scope: $scope, $stateParams: $stateParams}));
        };

        $scope.init();
    }
]);

client.controller('ClientProfileChangePasswordController',[
            '$scope','$rootScope','$dialog','ClientProfileService','blockUI',
    function($scope , $rootScope , $dialog , ClientProfileService , blockUI){

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
            var userObject = $rootScope.user();
            userObject.credentials = $scope.credentials;
            $scope.blockUI.changePasswordLayout.start('Changing password');
            ClientProfileService.changepassword(userObject)
                .success(function(response){
                    $scope.blockUI.changePasswordLayout.stop();
                    if(response.success){
                        $dialog.alert(response.message,'','');
                        $scope.init();
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

        $scope.loadLanguageList = function(){
            $scope.blockUI.manageProfileOtherSettings.start('Loading available languages...');
            ClientProfileService.languagelist()
                .success(function(response){
                    $scope.blockUI.manageProfileOtherSettings.stop();
                    if(response.success){
                        $scope.languagelist = response.data.languagelist
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
            $scope.blockUI.manageProfileOtherSettings.start('Saving...');
            ClientProfileService.saveothersettings($scope.otherSetting)
                .success(function(response){
                    $scope.blockUI.manageProfileOtherSettings.stop();
                    if(response.success){
                        $scope.otherSetting.user.Language = angular.copy($scope.otherSetting.Language);
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
            $scope.loadLanguageList();
            console.log($scope.otherSetting.Language)
        };
        $scope.init();
    }
]);