'use strict';

admin.controller('AdminStaticComponentsListController',[
            '$scope','$state','staticComponentService','blockUI','$dialog',
    function($scope , $state , staticComponentService , blockUI , $dialog){
        
        $scope.loadComponents = function(){
            if(!$scope.blockUI.loadComponents.state().blocking){
                $scope.blockUI.loadComponents.start('Loading components...');
                staticComponentService.loadComponent()
                .success(function(response){
                    if(response.success){
                        $scope.components = response.data.components;
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                    $scope.blockUI.loadComponents.stop();
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading components.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.loadComponents.stop();
                });
            }
        };
        $scope.edit = function(component){
            $state.go('admin.components.static.edit',{component: component,stateAction:'Edit'});
        };
        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                loadComponents: blockUI.instances.get('loadComponents')
            };
        };
        $scope.init = function(){
            console.log('AdminStaticComponentsListController loaded!');
            $scope.initBlockUiBlocks();
            $scope.loadComponents();
        };
        $scope.init();
    }
]);

admin.controller('AdminStaticComponentsEditController',[
            '$scope','$state','$stateParams','$dialog','$adminLookups','sobjectService','blockUI','staticComponentService','$adminModals',
    function($scope , $state , $stateParams , $dialog , $adminLookups , sobjectService , blockUI , staticComponentService , $adminModals){
        
        $scope.loadComponentDetails = function(){
            if(!$scope.blockUI.saveComponent.state().blocking){
                if($scope.component.name == 'Cost Allocation Component' || $scope.component.name == 'Other Charge Component'){
                    $scope.blockUI.saveComponent.start('Loading component details...');
                    sobjectService.loadSObjectFields($scope.component.child)
                        .success(function(response){
                            if(response.success === true){
                                $scope.sObjectFields = response.data.sObjectFields;
                            }else{
                                $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                            }
                            $scope.blockUI.saveComponent.stop();
                        })
                        .error(function(response){
                            $dialog.alert('Server Error occured while loading component details.','Error','pficon pficon-error-circle-o');
                            $scope.blockUI.saveComponent.stop();
                        });
                    sobjectService.loadSObjectFields($scope.component.parent)
                        .success(function(response){
                            if(response.success === true){
                                $scope.parentSObjectFields = response.data.sObjectFields;
                            }else{
                                $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                            }
                            $scope.blockUI.saveComponent.stop();
                        })
                        .error(function(response){
                            $dialog.alert('Server Error occured while loading component details.','Error','pficon pficon-error-circle-o');
                            $scope.blockUI.saveComponent.stop();
                        });
                }
            }  
        };
        $scope.openFieldCriteriaModal = function(field,index){
            $adminModals.criteriaModal({
                title: 'Field Criteria | ' + field.label,
                fields: $scope.parentSObjectFields,
                criteria: $scope.component.fields[index].criteria ? $scope.component.fields[index].criteria : null
            },function(criteria){
                $scope.component.fields[index].criteria = criteria;
            });
        };
        $scope.openSObjectsLookup = function(isForParent){
            $adminLookups.sObject({
                criteria: {
                    includeFields: true
                }
            },function(sObject){
                if(sObject === undefined){
                    if(isForParent){
                        $scope.component.parent = sObject;
                    }
                    else{
                        $scope.component.child = sObject;
                        $scope.component.fields = [];
                    }
                }else if($scope.component.SObject == undefined || $scope.component.SObject.name !== sObject.name){
                    if(isForParent){
                        $scope.parentSObjectFields = angular.copy(sObject.SObjectFields);
                        delete sObject.SObjectFields;
                        $scope.component.parent = angular.copy(sObject);
                    }
                    else{
                        $scope.component.child = angular.copy(sObject);
                        delete $scope.component.child.SObjectFields;
                        $scope.sObjectFields = angular.copy(sObject.SObjectFields);
                        $scope.component.fields = [];
                    }
                    // $scope.component.title = ($scope.component.title) ? $scope.component.title : sObject.labelPlural;
                }
            });
        };
        $scope.addToComponentFields = function(field){
            $scope.component.fields.push({
                SObjectField: field,
                type: 'SObject-Component-Field',
                label: field.label
            });
        };
        $scope.cancel = function(){
            $state.go('admin.components.static.list');  
        };
        $scope.saveComponent = function(){
            if(!$scope.blockUI.saveComponent.state().blocking){
                var componentToSave = angular.copy($scope.component);
                
                $scope.blockUI.saveComponent.start('Saving component...');
                staticComponentService.saveComponent(componentToSave)
                    .success(function(response){
                        if(response.success === true){
                            $state.go('admin.components.static.list');
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.saveComponent.stop();
                    })
                    .error(function(response){
                        $dialog.alert('Server Error occured while saving component.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.saveComponent.stop();
                    });
            }
        };
        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                saveComponent: blockUI.instances.get('saveComponent')
            };
        };
        $scope.onChangeReadonly = function(field){
            if(field.readonly)
                field.required=false;
        };
        $scope.onChangeRequired = function(field){
            if(field.required)
                field.readonly=false;
        };
        $scope.init = function(){
            console.log('AdminStaticComponentsEditController loaded!');
            $scope.initBlockUiBlocks();
            $scope.component = $stateParams.component;
            $scope.stateAction = $stateParams.stateAction;

            $scope.loadComponentDetails();
        };
        $scope.init();
    }
]);

admin.controller('AdminStaticComponentsController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        if(toState.name === 'admin.components.static' && fromState !== 'admin.components.static.list'){
            event.preventDefault();
            $state.go('admin.components.static.list');
        }
    });
    $scope.init = function(){
        console.log('AdminStaticComponentsController loaded!');
        $state.go('admin.components.static.list');
    };
    $scope.init();
}]);