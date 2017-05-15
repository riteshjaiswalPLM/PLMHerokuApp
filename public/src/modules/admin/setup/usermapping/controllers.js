'use strict';

admin.controller('AdminSetupUserMappingController',[
        '$scope','$rootScope','$state','$dialog','ModalService','userMappingService','blockUI','$adminLookups',
function($scope , $rootScope , $state , $dialog , ModalService , userMappingService , blockUI , $adminLookups){
    $scope.usermapping = {
        SObject: null,
        UsernameField: null,
        FirstnameField: null,
        LastnameField: null,
        EmailField: null
    };
    $scope.criteriaFields = [];
    $scope.$watch(function(){
        return $scope.usermapping.SObject;
    }, function(newVal, oldVal){
        if(newVal){
            $scope.criteriaFields = [];//newVal.SObject.SObjectFields;
            angular.forEach(newVal.SObjectFields, function(field){
                if(field.type === 'picklist' || field.type === 'boolean'){
                    $scope.criteriaFields.push(field);
                }
            });
        }
    });
    $scope.loadUserMappingConfiguration = function(){
        if(!$scope.blockUI.loadUserMappingConfiguration.state().blocking){
            $scope.blockUI.loadUserMappingConfiguration.start('Loading User Mapping Configuration...');
            userMappingService.loadUserMappingConfiguration({})
            .success(function(response){
                if(response.success === true){
                    $scope.usermapping = (response.data.userMapping) ? response.data.userMapping : $scope.usermapping;
                    $scope.usermapping.isMobileActive=$scope.usermapping.isMobileActive?$scope.usermapping.isMobileActive:false
                }else{
                    $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                }
                $scope.blockUI.loadUserMappingConfiguration.stop();
            })
            .error(function(response){
                $dialog.alert('Error occured while loading salesforce org configuration.','Error','pficon pficon-error-circle-o');
                $scope.blockUI.loadUserMappingConfiguration.stop();
            });
        }
    };
    $scope.openSObjectsLookup = function(){
        $adminLookups.sObject({
            criteria: {
                includeFields: true
            }
        },function(sObject){
            $scope.usermapping.SObject = sObject;
        });
    };
    $scope.openRolesLookup = function(){
        $adminLookups.role({}, function(role){
            $scope.usermapping.DefaultRole = role;
        });
    }
    $scope.edit = function(editable){
        if(editable){
            $scope.usermappingCopy = angular.copy($scope.usermapping);
        }else{
            $scope.usermapping = $scope.usermappingCopy;
        }
        $scope.enableEdit = editable;
    };
    $scope.save = function() {
        if($scope.usermapping.defaultPWD === undefined ||  $scope.usermapping.defaultPWD.trim()===""){
            $dialog.alert("Default Password Can Not Be Blank",'Error','pficon pficon-error-circle-o');
            return;
        }
        $scope.enableEdit = false;
        
        if(!$scope.blockUI.loadUserMappingConfiguration.state().blocking){
            $scope.blockUI.loadUserMappingConfiguration.start('Saving User Mapping Configuration...');
            userMappingService.saveUserMappingConfiguration($scope.usermapping)
            .success(function(response){
                if(response.success === true){
                    $scope.loadUserMappingConfiguration();
                }else{
                    $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                }
                $scope.blockUI.loadUserMappingConfiguration.stop();
            })
            .error(function(response){
                $dialog.alert('Error occured while saving salesforce org configuration.','Error','pficon pficon-error-circle-o');
                $scope.blockUI.loadUserMappingConfiguration.stop();
            });
        }
    };
    $scope.initBlockUiBlocks = function(){
        $scope.blockUI = {
            loadUserMappingConfiguration: blockUI.instances.get('loadUserMappingConfiguration') 
        }; 
    };
    $scope.init = function(){
        console.log('AdminSetupUserMappingController loaded!');
        $scope.initBlockUiBlocks();
        $scope.enableEdit = false;
        $scope.loadUserMappingConfiguration();
    };
    $scope.init();
}]);