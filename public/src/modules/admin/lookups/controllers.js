'use strict';

admin.controller('AdminLookupsListController',[
            '$scope','$state','lookupService','blockUI','$dialog','$timeout',
    function($scope , $state , lookupService , blockUI , $dialog , $timeout){
        $scope.loadLookups = function(){
            if(!$scope.blockUI.loadLookups.state().blocking){
                $scope.blockUI.loadLookups.start('Loading lookups...');
                lookupService.loadLookups({
                    criteria: {
                        where: {
                            default: false
                        }
                    }
                })
                .success(function(response){
                    if(response.success){
                        $scope.lookups = response.data.sObjectLookups;
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                    $scope.blockUI.loadLookups.stop();
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading lookups.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.loadLookups.stop();
                });
            }
        };
        $scope.deleteLookup = function(lookup){
            $dialog.confirm({
                title: 'Confirm delete ?',
                yes: 'Yes, Delete', no: 'Cancel',
                message: 'Are you sure to delete lookup for "'+ lookup.title +'" ?',
                class:'danger'
            },function(confirm){
                if(confirm){
                    $scope.blockUI.loadLookups.start('Deleting "'+lookup.title+'" lookup...');
                    lookupService.deleteLookup(lookup)
                        .success(function(response){
                            $scope.blockUI.loadLookups.stop();
                            if(response.success){
                                $scope.loadLookups();
                            }else{
                                $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                            }
                        })
                        .error(function (response) {
                            $scope.blockUI.loadLookups.stop();
                            $dialog.alert('Error occured while deleting lookup.','Error','pficon pficon-error-circle-o');
                        });
                }
            });
        };
        $scope.edit = function(lookup){
            $state.go('admin.lookups.edit',{lookup: lookup});
        };
        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                loadLookups: blockUI.instances.get('loadLookups')
            };
        };
        $scope.init = function(){
            console.log('AdminLookupsListController loaded!');
            $scope.initBlockUiBlocks();
            $scope.loadLookups();
        };
        $scope.init();
    }
]);

admin.controller('AdminLookupsEditController',[
            '$scope','$state','$stateParams','$dialog','$adminLookups','lookupService','sobjectService','blockUI',
    function($scope , $state , $stateParams , $dialog , $adminLookups , lookupService , sobjectService , blockUI ){
        
        $scope.openSObjectsLookup = function(){
            $adminLookups.sObject({
                criteria: {
                    includeFields: true
                }
            },function(sObject){
                if(sObject === undefined){
                    $scope.lookup.SObject = sObject;
                    $scope.lookup.SObjectLayoutFields = [];
                }else if($scope.lookup.SObject == null || $scope.lookup.SObject.name !== sObject.name){
                    $scope.lookup.SObject = sObject;
                    $scope.lookup.SObjectLayoutFields = [];
                    $scope.lookup.title = ($scope.lookup.title) ? $scope.lookup.title : sObject.labelPlural;
                    angular.forEach(sObject.SObjectFields, function(field){
                        if(field.name === 'Name'){
                            $scope.addToLookupFields(field);
                        }
                    });
                }
            });
        };
        
        $scope.addToLookupFields = function(field){
            $scope.lookup.SObjectLayoutFields.push({
                SObjectField: field,
                type: 'SObject-Lookup-Field',
                label: field.label
            });
        };
        
        $scope.loadLookupDetails = function(){
            if($scope.lookup.id !== undefined && !$scope.blockUI.saveLookup.state().blocking){
                $scope.blockUI.saveLookup.start('Loading lookup details...');
                lookupService.loadLookupDetails($scope.lookup)
                    .success(function(response){
                        if(response.success === true){
                            $scope.lookup = response.data.sObjectLookup;
                            $scope.refSObjects = response.data.refSObjects;
                        }else{
                            $dialog.alert('Error occured while saving layout.','Error','pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.saveLookup.stop();
                    })
                    .error(function(response){
                        $dialog.alert('Server Error occured while loading lookup details.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.saveLookup.stop();
                    });
            }  
        };
        
        $scope.saveLookup = function(){
            if(!$scope.blockUI.saveLookup.state().blocking){
                var lookupToSave = angular.copy($scope.lookup);
                lookupToSave.sobjectname = lookupToSave.SObject.name;
                lookupToSave.SObjectId = lookupToSave.SObject.id;
                angular.forEach(lookupToSave.SObjectLayoutFields,function(field){
                    field.SObjectFieldId = field.SObjectField.id;
                    delete field.SObjectField;
                });
                delete lookupToSave.SObject;
                
                $scope.blockUI.saveLookup.start('Saving lookup...');
                lookupService.saveLookup(lookupToSave)
                    .success(function(response){
                        if(response.success === true){
                            if($scope.stateAction === 'Create'){
                                $dialog.confirm({
                                    title: 'Create more ?',
                                    yes: 'Yes', no: 'No, Thanks',
                                    message: 'Lookup created successfully? \nCreate more lookup ?',
                                    class:'primary'
                                },function(confirm){
                                    if(confirm){
                                        // CREATE MORE
                                        $scope.lookup = angular.copy($scope.newLookup);
                                    }else{
                                        $state.go('admin.lookups.list');
                                    }
                                });
                            }else{
                                $state.go('admin.lookups.list');
                            }
                        }else{
                            $dialog.alert('Error occured while saving layout.','Error','pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.saveLookup.stop();
                    })
                    .error(function(response){
                        $dialog.alert('Server Error occured while saving lookup.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.saveLookup.stop();
                    });
            }
        };
        
        $scope.cancel = function(){
            $state.go('admin.lookups.list');  
        };
        
        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                saveLookup: blockUI.instances.get('saveLookup')
            };
        };
        
        $scope.init = function(){
            $scope.newLookup = {
                SObject: null,
                title: null,
                description: null,
                active: true,
                SObjectLayoutFields: []
            };
            console.log('AdminLookupsEditController loaded!');
            $scope.initBlockUiBlocks();
            $scope.lookup = ($stateParams.lookup) ? $stateParams.lookup : angular.copy($scope.newLookup);
            $scope.stateAction = ($stateParams.lookup) ? 'Edit' : 'Create';
            $scope.loadLookupDetails();
        };
        $scope.init();
    }
]);