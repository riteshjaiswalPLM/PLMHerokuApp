'use strict';

admin.controller('AdminSetupSSOConfigController',[
        '$scope','$rootScope','$state','$dialog','ModalService','ssoConfigService','blockUI','$adminLookups',
function($scope , $rootScope , $state , $dialog , ModalService , ssoConfigService , blockUI , $adminLookups){
    $scope.ssoConfig = {
        entryPoint: null,
        cert: null,
        signatureAlgorithm: null,
        authnRequestBinding: null,
        issuer: null,
        identifierFormat: null,
        linkCaption: null
    };
    $scope.loadSSOConfiguration = function(){
        if(!$scope.blockUI.loadSSOConfiguration.state().blocking){
            $scope.blockUI.loadSSOConfiguration.start('Loading SSO Configuration...');
            ssoConfigService.loadSSOConfiguration({})
            .success(function(response){
                if(response.success === true){
                    $scope.ssoConfig = (response.data.ssoConfig) ? response.data.ssoConfig : $scope.ssoConfig;
                    $scope.ssoConfig.active = $scope.ssoConfig.active ? $scope.ssoConfig.active : false;
                    $scope.loadUserTableColumn();
                }else{
                    $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                }
                $scope.blockUI.loadSSOConfiguration.stop();
            })
            .error(function(response){
                $dialog.alert('Error occured while loading salesforce org configuration.','Error','pficon pficon-error-circle-o');
                $scope.blockUI.loadSSOConfiguration.stop();
            });
        }
    };
    $scope.edit = function(editable){
        if(editable){
            $scope.ssoConfigCopy = angular.copy($scope.ssoConfig);
        }else{
            $scope.ssoConfig = $scope.ssoConfigCopy;
        }
        $scope.enableEdit = editable;
    };
    $scope.save = function() {
        if($scope.ssoConfig.active === true && ($scope.ssoConfig.entryPoint === null || $scope.ssoConfig.entryPoint === undefined || ($scope.ssoConfig.entryPoint && $scope.ssoConfig.entryPoint.trim()===""))){
            $dialog.alert("Entery point can not be blank.",'Error','pficon pficon-error-circle-o');
            return;
        }
        if($scope.ssoConfig.active === true && ($scope.ssoConfig.cert === null || $scope.ssoConfig.cert === undefined || ($scope.ssoConfig.cert && $scope.ssoConfig.cert.trim()===""))){
            $dialog.alert("Certificate can not be blank.",'Error','pficon pficon-error-circle-o');
            return;
        }
        if($scope.ssoConfig.active === true && ($scope.ssoConfig.linkCaption === null || $scope.ssoConfig.linkCaption === undefined || ($scope.ssoConfig.linkCaption && $scope.ssoConfig.linkCaption.trim()===""))){
            $dialog.alert("Homepage SSO link caption can not be blank.",'Error','pficon pficon-error-circle-o');
            return;
        }
        
        $scope.enableEdit = false;

        if(!$scope.blockUI.loadSSOConfiguration.state().blocking){
            $scope.blockUI.loadSSOConfiguration.start('Saving SSO Configuration...');
            ssoConfigService.saveSSOConfiguration($scope.ssoConfig)
            .success(function(response){
                if(response.success === true){
                    $scope.loadSSOConfiguration();
                }else{
                    $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                }
                $scope.blockUI.loadSSOConfiguration.stop();
            })
            .error(function(response){
                $dialog.alert('Error occured while saving salesforce org configuration.','Error','pficon pficon-error-circle-o');
                $scope.blockUI.loadSSOConfiguration.stop();
            });
        }
    };
    $scope.initBlockUiBlocks = function(){
        $scope.blockUI = {
            loadSSOConfiguration: blockUI.instances.get('loadSSOConfiguration') 
        }; 
    };
    $scope.loadUserTableColumn = function(){
        // if(!$scope.blockUI.loadSSOConfiguration.state().blocking){
            $scope.blockUI.loadSSOConfiguration.start('Loading user table fields...');
            ssoConfigService.loadUserTableColumn()
            .success(function(response){
                if(response.success === true){
                    $scope.userTableFields = response.data.userTableFields;
                }else{
                    $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                }
                $scope.blockUI.loadSSOConfiguration.stop();
            })
            .error(function(response){
                $dialog.alert('Error occured while saving salesforce org configuration.','Error','pficon pficon-error-circle-o');
                $scope.blockUI.loadSSOConfiguration.stop();
            });
        // }
    };
    $scope.init = function(){
        console.log('AdminSetupSSOConfigController loaded!');
        $scope.initBlockUiBlocks();
        $scope.enableEdit = false;
        $scope.requestMethod = [{value:'HTTP-POST',label:'HTTP-POST'},{value:'HTTP-Redirect',label:'HTTP-Redirect'}];
        $scope.signatureAlgorithm = [{value:'sha1',label:'sha1'},{value:'sha256',label:'sha256'}];
        $scope.nameIdFormates = [
            {label:'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified'},
            {label:'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'},
            {label:'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent'},
            {label:'urn:oasis:names:tc:SAML:2.0:nameid-format:transient'}
        ]
        $scope.loadSSOConfiguration();
    };
    $scope.init();
}]);