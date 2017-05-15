'use strict';

admin.controller('AdminSetupSfdcController',[
        '$scope','$rootScope','$state','$dialog','ModalService','setupService','blockUI',
function($scope , $rootScope , $state , $dialog , ModalService , setupService , blockUI){
    $scope.sfdc = {
        username: '',
        password: '',
        token: '',
        environment: ''
    };
    $scope.loadSalesforceConfiguration = function(){
        if(!$scope.blockUI.loadSalesforceConfiguration.state().blocking){
            $scope.blockUI.loadSalesforceConfiguration.start('Loading Salesforce Org Configuration...');
            setupService.loadSalesforceConfiguration({})
            .success(function(response){
                if(response.success === true){
                    $scope.sfdc = response.data.sfdc;
                    $scope.sfdcOrgId = response.data.orgId;
                    $scope.locale = response.data.locale;
                    $scope.timezone = response.data.timezone;
                }else{
                    $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                }
                $scope.blockUI.loadSalesforceConfiguration.stop();
            })
            .error(function(response){
                $dialog.alert('Error occured while loading salesforce org configuration.','Error','pficon pficon-error-circle-o');
                $scope.blockUI.loadSalesforceConfiguration.stop();
            });
        }
    };
    $scope.edit = function(){
        ModalService.showModal({
            templateUrl: 'views/admin/setup/sfdc/edit.html',
            controller:'AdminSetupSfdcEditModalController',
            inputs:{
                data: {
                    sfdc: angular.copy($scope.sfdc),
                    timezone: $scope.timezone,
                    locale: $scope.locale,
                    title: 'Edit Salesforce Org Configuration'   
                }
            }
        }).then(function(modal){
            modal.element.modal();
            modal.close.then(function(sfdc){
                $scope.sfdc = sfdc;
                location.reload(true);
            });
        });
    };
    $scope.removeOrg = function(){
        if(!$scope.blockUI.loadSalesforceConfiguration.state().blocking){
            $dialog.confirm({
                title: 'Confirm delete ?',
                yes: 'Yes, Delete', no: 'Cancel',
                message: 'All information related to configured org will be deleted. \nAre you sure ?',
                class:'danger'
            },function(confirm){
                if(confirm){
                    $scope.blockUI.loadSalesforceConfiguration.start('Removing salesforce configuration...');
                    setupService.RemoveSalesforceConfiguration({})
                    .success(function(response){
                        $scope.blockUI.loadSalesforceConfiguration.stop();
                        if(response.success === true){
                            location.reload(true);
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                    })
                    .error(function(response){
                        $dialog.alert('Error occured while removing salesforce org configuration.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.loadSalesforceConfiguration.stop();
                    });
                }
            });
        }
    };
    $scope.initBlockUiBlocks = function(){
        $scope.blockUI = {
            loadSalesforceConfiguration: blockUI.instances.get('loadSalesforceConfiguration') 
        }; 
    };
    $scope.init = function(){
        console.log('AdminSetupSfdcController loaded!');
        $scope.initBlockUiBlocks();
        $scope.loadSalesforceConfiguration();
    };
    $scope.init();
}]);

admin.controller('AdminSetupSfdcEditModalController',[
        '$scope','$rootScope','$element','$dialog','blockUI','ModalService','data','close','setupService',
function($scope , $rootScope , $element , $dialog , blockUI , ModalService , data , close , setupService){
    $scope.title = (data.title) ? data.title : 'Edit Salesforce Org configuration';
    $scope.sfdcEnvs = [{label:'Production',value:'PRODUCTION'},{label:'Sandbox',value:'SANDBOX'}];
    $scope.timezones = data.timezone;
    $scope.locales = data.locale;
    $scope.sfdc = (data.sfdc) ?  data.sfdc : {
        username: null,
        password: null,
        token: null,
        environment: null
    };
    $scope.close = function(){
        $element.modal('hide');
    };
    $scope.save = function(){
        if(!$scope.blockUI.editSalesforceConfiguration.state().blocking){
            if($scope.sfdc.LocaleId === null || $scope.sfdc.TimeZoneId === null){
                $dialog.alert('Locale and Time Zone are mandatory.','Error','pficon pficon-error-circle-o');    
                return;
            }
            $scope.blockUI.editSalesforceConfiguration.start('Configuring salesforce...');
            setupService.saveSalesforceConfiguration($scope.sfdc)
                .success(function(response){
                    $scope.blockUI.editSalesforceConfiguration.stop();
                    if(response.success === true){
                        if(response.affectedCount > 0){
                            $element.modal('hide');
                            close($scope.sfdc, 500);
                        }else{
                            $dialog.alert('Problem with saving salesforce configuration.','Error','pficon pficon-error-circle-o');    
                        }
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                })
                .error(function(response){
                    $dialog.alert('Error occured while saving salesforce org configuration.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.editSalesforceConfiguration.stop();
                });
        }
    }
    $scope.initBlockUiBlocks = function(){
        $scope.blockUI = {
            editSalesforceConfiguration: blockUI.instances.get('editSalesforceConfiguration') 
        }; 
    };
    $scope.init = function(){
        console.log('AdminSetupSfdcEditModalController loaded!');
        $scope.initBlockUiBlocks();
    };
    $scope.init();
}]);