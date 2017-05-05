'use strict';
admin.controller('AdminMobileGovernFieldsController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        if(toState.name === 'admin.mobile.governfields' && fromState !== 'admin.mobile.governfields.list'){
            event.preventDefault();
            $state.go('admin.mobile.governfields.list');
        }
    });
    $scope.init = function(){
        console.log('AdminMobileGovernFieldsController loaded!');
        $state.go('admin.mobile.governfields.list');
    };
    $scope.init();
}]);

admin.controller('AdminMobileGovernFieldsListController',[
            '$scope','$state','mobileGovernFieldsService','blockUI','$dialog','$filter',
    function($scope , $state , mobileGovernFieldsService , blockUI , $dialog,$filter){
    
    $scope.loadSObjects = function(){
        if(!$scope.blockUI.loadSObjects.state().blocking){
            $scope.blockUI.loadSObjects.start('Loading local sobjects...');
            mobileGovernFieldsService.loadSObjects({})
                .success(function(response){
                    if(response.success){
                        $scope.sObjects = $filter('filter')(response.data.sObjects, {forMobile:true});
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                    $scope.blockUI.loadSObjects.stop();
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading local sobjects.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.loadSObjects.stop();
                });
        }
    };
    
    $scope.manageSObjectGovernFields = function(sObject){
        $state.go('admin.mobile.governfields.managesobjectgovernfields',{ sObject: sObject });
    }
    $scope.manage = function(){
        $state.go('admin.mobile.sobjects');
    }
    $scope.initBlockUiBlocks = function(){
        $scope.blockUI = {
            loadSObjects: blockUI.instances.get('loadSObjects')
        };
    };
    $scope.init = function(){
        console.log('AdminMobileGovernFieldsListController loaded!');
        $scope.initBlockUiBlocks();
        $scope.loadSObjects();
    };
    $scope.init();
}]);

admin.controller('AdminMobileGovernFieldsManageController',[
            '$scope','$state','$stateParams','$timeout','$q','mobileGovernFieldsService','sfdcService','blockUI','$dialog','$filter',
    function($scope , $state ,$stateParams, $timeout , $q , mobileGovernFieldsService , sfdcService , blockUI , $dialog,$filter){
    $scope.sObject = ($stateParams.sObject) ? $stateParams.sObject : null;        
    $scope.manage = function(){
        $state.go('admin.mobile.sobjects');
    }
    $scope.dependentSObjectsFields = function(sObjectFields){
        var dependentSObjectFieldsNames = [];
        if($scope.sfdcSObjectFields !== undefined && $scope.sfdcSObjectFields !== null && $scope.sfdcSObjectFields.length > 0 && $scope.sObjectFields.length > 0){
            if(sObjectFields.type === 'picklist' && sObjectFields.controllerName && sObjectFields.controllerName!="" && sObjectFields.custom === true && dependentSObjectFieldsNames.indexOf(sObjectFields.controllerName) === -1 && $scope.sObjectsFieldsNames.indexOf(sObjectFields.controllerName) === -1){
                dependentSObjectFieldsNames.push(sObjectFields.controllerName);
            }
        }
        return dependentSObjectFieldsNames;
    };
    $scope.loadSObjectFields = function(){
        if(!$scope.blockUI.loadSObjectsFields.state().blocking){
            $scope.blockUI.loadSObjectsFields.start('Loading local sobjects fields...');
            $scope.blockUI.describeSObjectsFields.start('Loading salesforce sobjects fields...');
            mobileGovernFieldsService.loadSObjectFields($scope.sObject)
                .success(function(response){
                    if(response.success){
                        $scope.sObjectFields =  $filter('filter')(response.data.sObjectFields, {forMobile:true,type:'picklist',isGovernField:true});
                        $scope.sfdcSObjectFields= $filter('filter')(response.data.sObjectFields, {forMobile:true,type:'picklist',isGovernField:false});
                        $scope.sObjectsFieldsNames = [];
                        angular.forEach($scope.sObjectFields, function(sObjField){
                            $scope.sObjectsFieldsNames.push(sObjField.name);
                        });
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                    $scope.blockUI.loadSObjectsFields.stop();
                    $scope.blockUI.describeSObjectsFields.stop();
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading local sobjects.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.loadSObjectsFields.stop();
                    $scope.blockUI.describeSObjectsFields.stop();
                });
        }
    }
    $scope.syncRefSObjectsFields = function(sObjectFields){
        var dependentSObjectfieldsNames = $scope.dependentSObjectsFields(sObjectFields);
        var sObjectsToSync = [];
        $scope.blockUI.sObjectActions.start('Preparing ...');
        angular.forEach($scope.sfdcSObjectFields, function(sfdcSObjFields){
            if(dependentSObjectfieldsNames.indexOf(sfdcSObjFields.name) !== -1){
                sObjectsToSync.push(angular.copy(sfdcSObjFields));
            }
        });
        console.log(sObjectsToSync);
        $scope.blockUI.sObjectActions.stop();
        
        $scope.currentSObjectIndex = 0;
        var stopSync = $scope.$watch(function(){
            return $scope.currentSObjectIndex;
        },function(newValue,oldValue){
            console.log(newValue + ' :: ' + oldValue);
            if(newValue === 0 || newValue === (oldValue + 1)){
                if(newValue === sObjectsToSync.length){
                    stopSync();
                    $scope.loadSObjectFields();
                }else{
                    $scope.newSObjectFields(sObjectsToSync[newValue], function(){
                        $scope.currentSObjectIndex++;
                    });
                }
            }
        });
    };
    $scope.syncOne = function(sObject,callback){
        $timeout(function(){
            console.error('Synchronizing '+ sObject.label +'...');
            callback();
        },1000);
    };
    $scope.newSObjectFields = function(sObjectFields, callback){
        $scope.blockUI.sObjectActions.start('Synchronizing '+ sObjectFields.label +'...');
        // $scope.blockUI.sObjectActions.start('Saving new SObject...');
        if($scope.sObjectFields.length >= 5){
            $dialog.alert("Maximum 5 fields are allowed in Mobile sObjects Govern Fields",'Error','pficon pficon-error-circle-o');
            $scope.blockUI.sObjectActions.stop();
            return;
        }

        var duplicate = false;
        angular.forEach($scope.sObjectFields,function(sObjField){
            if(!duplicate && sObjField.name === sObjectFields.name){
                duplicate = true;
            }
        });
        if(duplicate){
            $dialog.alert('Duplicate entry found for '+ sObjectFields.label, 'Duplicate', 'pficon pficon-warning-triangle-o');
            $scope.blockUI.sObjectActions.stop();
            return;
        }
        sObjectFields.isGovernField=true;
        mobileGovernFieldsService.updateSObjectFields(sObjectFields)
            .success(function(response){
                if(response.success){
                    if(!callback){
                        $scope.loadSObjectFields();
                    }
                }else{
                    $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                }
                $scope.blockUI.sObjectActions.stop();
                if(callback){
                    callback();
                }
            })
            .error(function(response){
                $dialog.alert('Error occured while saving new sObject fields.','Error','pficon pficon-error-circle-o');
                $scope.blockUI.sObjectActions.stop();
                if(callback){
                    callback(true);
                }
            });
    }
    $scope.deleteSObject = function(sObjectFields){
        $dialog.confirm({
            title: 'Confirm delete ?',
            yes: 'Yes, Delete', no: 'Cancel',
            message: 'All information related to '+ sObjectFields.label +' will be deleted. \nAre you sure ?',
            class:'danger'
        },function(confirm){
            if(confirm){
                $scope.blockUI.sObjectActions.start('Deleting '+ sObjectFields.label +'...');
                sObjectFields.isGovernField=false;
                mobileGovernFieldsService.updateSObjectFields(sObjectFields)
                    .success(function(response){
                        $scope.blockUI.sObjectActions.stop();
                        if(response.success){
                            $scope.loadSObjectFields();
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                    })
                    .error(function (response) {
                        $scope.blockUI.sObjectActions.stop();
                        $dialog.alert('Error occured while deleting sObject.','Error','pficon pficon-error-circle-o');
                    });
            }
        });
    }
    
    $scope.refreshResults = function(){
        if(!$scope.blockUI.sObjectActions.state().blocking){
            // $scope.describeSObjects();
            $scope.loadSObjectFields();
            
        }
    };
    $scope.returnToList = function(){
        $state.go('admin.mobile.governfields.list');  
    };
    $scope.initBlockUiBlocks = function(){
        $scope.blockUI = {
            sObjectActions: blockUI.instances.get('sObjectActions'),
            describeSObjectsFields: blockUI.instances.get('describeSObjects'),
            loadSObjectsFields: blockUI.instances.get('loadSObjects')
        };
    };
    $scope.init = function(){
        $scope.initBlockUiBlocks();
        console.log('AdminMobileSObjectsFieldsManageController loaded!');
        $scope.refreshResults();
    };  
    $scope.init();
}]);
