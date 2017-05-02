'use strict';

admin.controller('AdminSetupSObjectsController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        if(toState.name === 'admin.setup.sobjects' && fromState !== 'admin.setup.sobjects.list'){
            event.preventDefault();
            $state.go('admin.setup.sobjects.list');
        }
    });
    $scope.init = function(){
        console.log('AdminSetupSObjectsController loaded!');
        $state.go('admin.setup.sobjects.list');
    };
    $scope.init();
}]);

admin.controller('AdminSetupSObjectsListController',[
            '$scope','$state','sobjectService','blockUI','$dialog',
    function($scope , $state , sobjectService , blockUI , $dialog){
    
    $scope.loadSObjects = function(){
        if(!$scope.blockUI.loadSObjects.state().blocking){
            $scope.blockUI.loadSObjects.start('Loading local sobjects...');
            sobjectService.loadSObjects({})
                .success(function(response){
                    if(response.success){
                        $scope.sObjects = response.data.sObjects;
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
    $scope.deleteSObject = function(sObject){
        $dialog.confirm({
            title: 'Confirm delete ?',
            yes: 'Yes, Delete', no: 'Cancel',
            message: 'All information related to '+ sObject.label +' will be deleted. \nAre you sure ?',
            class:'destructive',
            headerClass:'error'
        },function(confirm){
            if(confirm){
                $scope.blockUI.loadSObjects.start('Deleting '+ sObject.label +'...');
                sobjectService.deleteSObject(sObject)
                    .success(function(response){
                        $scope.blockUI.loadSObjects.stop();
                        if(response.success){
                            $scope.loadSObjects();
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                    })
                    .error(function (response) {
                        $scope.blockUI.loadSObjects.stop();
                        $dialog.alert('Error occured while deleting sObject.','Error','pficon pficon-error-circle-o');
                    });
            }
        });
    }
    $scope.viewSObject = function(sObject){
        $state.go('admin.setup.sobjects.details',{ sObject: sObject });
    }
    
    $scope.manage = function(){
        $state.go('admin.setup.sobjects.manage');
    }
    
    $scope.initBlockUiBlocks = function(){
        $scope.blockUI = {
            loadSObjects: blockUI.instances.get('loadSObjects')
        };
    };
    $scope.init = function(){
        console.log('AdminSetupSObjectsListController loaded!');
        $scope.initBlockUiBlocks();
        $scope.loadSObjects();
    };
    $scope.init();
}]);

admin.controller('AdminSetupSObjectsManageController',[
            '$scope','$state','$timeout','$q','sobjectService','sfdcService','blockUI','$dialog',
    function($scope , $state , $timeout , $q , sobjectService , sfdcService , blockUI , $dialog){
        
    $scope.describeSObjects = function(){
        if(!$scope.blockUI.describeSObjects.state().blocking){
            $scope.blockUI.describeSObjects.start('Loading salesforce sobjects...');
            sfdcService.describeSObjects({})
                .success(function(response){
                    if(response.success){
                        $scope.sfdcSObjects = response.data.sobjects;
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                    $scope.blockUI.describeSObjects.stop();
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading salesforce sobjects.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.describeSObjects.stop();
                });
        }
    }
    $scope.lookupSObjects = function(sObject){
        var lookupSObjectsNames = [];
        if($scope.sfdcSObjects !== undefined && $scope.sfdcSObjects !== null && $scope.sfdcSObjects.length > 0 && $scope.sObjects.length > 0){
            angular.forEach(sObject.SObjectFields, function(field){
                if(field.type === 'reference' && field.custom === true && lookupSObjectsNames.indexOf(field.referenceTo[0]) === -1 && $scope.sObjectsNames.indexOf(field.referenceTo[0]) === -1){
                    lookupSObjectsNames.push(field.referenceTo[0]);
                }
            });
        }
        return lookupSObjectsNames;
    };
    $scope.loadSObjects = function(){
        if(!$scope.blockUI.loadSObjects.state().blocking){
            $scope.blockUI.loadSObjects.start('Loading local sobjects...');
            sobjectService.loadSObjects({
                    includeFields: true
                })
                .success(function(response){
                    if(response.success){
                        $scope.sObjects = response.data.sObjects;
                        $scope.sObjectsNames = [];
                        angular.forEach($scope.sObjects, function(sObj){
                            $scope.sObjectsNames.push(sObj.name);
                        });
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
    }
    $scope.syncRefSObjects = function(sObject){
        var refSObjectNames = $scope.lookupSObjects(sObject);
        var sObjectsToSync = [];
        $scope.blockUI.sObjectActions.start('Preparing ...');
        angular.forEach($scope.sfdcSObjects, function(sfdcSObj){
            if(refSObjectNames.indexOf(sfdcSObj.name) !== -1){
                sObjectsToSync.push(angular.copy(sfdcSObj));
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
                    console.error('STOP');
                    stopSync();
                    $scope.loadSObjects();
                }else{
                    $scope.newSObject(sObjectsToSync[newValue], function(){
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
    $scope.newSObject = function(sObject, callback){
        $scope.blockUI.sObjectActions.start('Synchronizing '+ sObject.label +'...');
        // $scope.blockUI.sObjectActions.start('Saving new SObject...');
        
        var duplicate = false;
        angular.forEach($scope.sObjects,function(sObj){
            if(!duplicate && sObj.name === sObject.name){
                duplicate = true;
            }
        });
        if(duplicate){
            $dialog.alert('Duplicate entry found for '+ sObject.label, 'Duplicate', 'pficon pficon-warning-triangle-o');
            $scope.blockUI.sObjectActions.stop();
            return;
        }
        
        sobjectService.newSObject(sObject)
            .success(function(response){
                if(response.success){
                    if(!callback){
                        $scope.loadSObjects();
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
                $dialog.alert('Error occured while saving new sObject.','Error','pficon pficon-error-circle-o');
                $scope.blockUI.sObjectActions.stop();
                if(callback){
                    callback(true);
                }
            });
    }
    $scope.deleteSObject = function(sObject){
        $dialog.confirm({
            title: 'Confirm delete ?',
            yes: 'Yes, Delete', no: 'Cancel',
            message: 'All information related to '+ sObject.label +' will be deleted. \nAre you sure ?',
            class:'danger'
        },function(confirm){
            if(confirm){
                $scope.blockUI.sObjectActions.start('Deleting '+ sObject.label +'...');
                sobjectService.deleteSObject(sObject)
                    .success(function(response){
                        $scope.blockUI.sObjectActions.stop();
                        if(response.success){
                            $scope.loadSObjects();
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
            $scope.describeSObjects();
            $scope.loadSObjects();
        }
    };
    $scope.returnToList = function(){
        $state.go('admin.setup.sobjects.list');  
    };
    $scope.initBlockUiBlocks = function(){
        $scope.blockUI = {
            sObjectActions: blockUI.instances.get('sObjectActions'),
            describeSObjects: blockUI.instances.get('describeSObjects'),
            loadSObjects: blockUI.instances.get('loadSObjects')
        };
    };
    $scope.init = function(){
        $scope.initBlockUiBlocks();
        console.log('AdminSetupSObjectsManageController loaded!');
        $scope.refreshResults();
    };  
    $scope.init();
}]);

admin.controller('AdminSetupSObjectsDetailsController',[
            '$scope','$state','$stateParams','sobjectService','sfdcService','blockUI','$dialog','$timeout',
    function($scope , $state , $stateParams , sobjectService , sfdcService , blockUI , $dialog , $timeout){
        $scope.sObject = ($stateParams.sObject) ? $stateParams.sObject : null;
        console.log($scope.sObject);
        
        $scope.loadSObjectFields = function(){
            if(!$scope.blockUI.sObjectFields.state().blocking && $scope.sObject != null){
                $scope.blockUI.sObjectFields.start('Loading '+ $scope.sObject.label +' fields...');
                sobjectService.loadSObjectFields($scope.sObject)
                    .success(function(response){
                        if(response.success){
                            $scope.sObjectFields = response.data.sObjectFields;
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.sObjectFields.stop();
                    })
                    .error(function(response){
                        $dialog.alert('Error occured while loading sobject fields.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.sObjectFields.stop();
                    });
            }
        };
        $scope.returnToList = function(){
            $state.go('admin.setup.sobjects.list');  
        };
        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                sObjectFields: blockUI.instances.get('sObjectFields')
            };
        };
        $scope.init = function(){
            $scope.initBlockUiBlocks();
            console.log('AdminSetupSObjectsDetailsController loaded!');
            $scope.loadSObjectFields();
        };  
        $scope.init();
    }
]);