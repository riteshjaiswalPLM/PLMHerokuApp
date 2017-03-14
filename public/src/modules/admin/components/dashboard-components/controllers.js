'use strict';

admin.controller('AdminDashboardComponentsListController',[
            '$scope','$state','genericComponentService','blockUI','$dialog',
    function($scope , $state , genericComponentService , blockUI , $dialog){
        
        $scope.loadComponents = ()=>{
            if(!$scope.blockUI.loadComponents.state().blocking){
                $scope.blockUI.loadComponents.start('Loading components...');
                genericComponentService.loadDashboardComponent()
                    .success((response)=>{
                        if(response.success){
                            $scope.components = response.data.components;
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.loadComponents.stop();
                    })
                    .error((response)=>{
                        $dialog.alert('Error occured while loading components.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.loadComponents.stop();
                    });
            }
        };
        $scope.deleteComponent = (component)=>{
            $dialog.confirm({
                title: 'Confirm delete ?',
                yes: 'Yes, Delete', no: 'Cancel',
                message: 'Are you sure to delete component for "'+ component.title +'" ?',
                class:'danger'
            },(confirm)=>{
                if(confirm){
                    $scope.blockUI.loadComponents.start('Deleting "'+component.title+'" component...');
                    genericComponentService.deleteComponent(component)
                        .success((response)=>{
                            $scope.blockUI.loadComponents.stop();
                            if(response.success){
                                $scope.loadComponents();
                            }else{
                                $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                            }
                        })
                        .error((response)=>{
                            $scope.blockUI.loadComponents.stop();
                            $dialog.alert('Error occured while deleting component.','Error','pficon pficon-error-circle-o');
                        });
                }
            });
        };
        $scope.edit = (component)=>{
            $state.go('admin.components.dashboard.edit',{component: component,stateAction:'Edit'});
        };
        $scope.create = (catagory)=>{
            var component = {};
            component.catagory = catagory;
            $state.go('admin.components.dashboard.edit',{component: component,stateAction:'Create'});
        };
        $scope.initBlockUiBlocks = ()=>{
            $scope.blockUI = {
                loadComponents: blockUI.instances.get('loadComponents')
            };
        };
        $scope.init = ()=>{
            console.log('AdminDashboardComponentsListController loaded!');
            $scope.initBlockUiBlocks();
            $scope.loadComponents();
        };
        $scope.init();
    }
]);

admin.controller('AdminDashboardComponentsEditController',[
            '$scope','$state','$stateParams','$dialog','$adminLookups','sobjectService','blockUI','genericComponentService',
    function($scope , $state , $stateParams , $dialog , $adminLookups , sobjectService , blockUI , genericComponentService ){
        
        $scope.loadComponentDetails = ()=>{
            if($scope.component.id !== undefined && !$scope.blockUI.saveDashoardComponent.state().blocking){
                $scope.blockUI.saveDashoardComponent.start('Loading component details...');
                genericComponentService.loadComponentDetails($scope.component)
                    .success((response)=>{
                        if(response.success === true){
                            $scope.component = response.data.component;
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.saveDashoardComponent.stop();
                    })
                    .error((response)=>{
                        $dialog.alert('Server Error occured while loading component details.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.saveDashoardComponent.stop();
                    });
            } 
        };
        $scope.openSObjectsLookup = ()=>{
            $adminLookups.sObject({
                criteria: {
                    includeFields: true
                }
            },(sObject)=>{
                if(!$scope.component.hasOwnProperty('ComponentDetails')){
                    $scope.component.ComponentDetails = [];
                    if($scope.component.ComponentDetails.length === 0){
                        $scope.component.ComponentDetails.push({});
                        $scope.component.ComponentDetails[0].configuration = {};
                    }
                }
                if(sObject === undefined){
                    $scope.component.SObject = sObject;
                    $scope.component.ComponentDetails[0].configuration.fields = [];
                }else if($scope.component.SObject == null || $scope.component.SObject.name !== sObject.name){
                    $scope.component.SObject = sObject;
                    $scope.component.ComponentDetails[0].configuration.fields = [];
                    $scope.sObjectFields = angular.copy(sObject.SObjectFields);
                    $scope.component.title = ($scope.component.title) ? $scope.component.title : sObject.labelPlural;
                }
            });
        };
        $scope.addToComponentFields = (field)=>{
            $scope.component.ComponentDetails[0].configuration.fields.push({
                SObjectField: field,
                label: field.label
            });
        };
        $scope.cancel = ()=>{
            $state.go('admin.components.dashboard.list');  
        };
        $scope.saveComponent = ()=>{
            if(!$scope.blockUI.saveDashoardComponent.state().blocking){
                var componentToSave = angular.copy($scope.component);
                componentToSave.sobjectname = componentToSave.SObject.name;
                componentToSave.SObjectId = componentToSave.SObject.id;
                delete componentToSave.SObject;
                console.info(componentToSave);
                
                $scope.blockUI.saveDashoardComponent.start('Saving component...');
                genericComponentService.saveComponent(componentToSave)
                    .success((response)=>{
                        if(response.success === true){
                            if($scope.stateAction === 'Create'){
                                $dialog.confirm({
                                    title: 'Create more ?',
                                    yes: 'Yes', no: 'No, Thanks',
                                    message: 'Component created successfully. \nCreate more component ?',
                                    class:'primary'
                                },(confirm)=>{
                                    if(confirm){
                                        // CREATE MORE
                                        $scope.newCompnent = {}
                                        $scope.newCompnent.catagory = componentToSave.catagory;
                                        $scope.component = angular.copy($scope.newCompnent);
                                    }else{
                                        $state.go('admin.components.dashboard.list');
                                    }
                                });
                            }else{
                                $state.go('admin.components.dashboard.list');
                            }
                        }else{
                            $dialog.alert('Error occured while saving component.','Error','pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.saveDashoardComponent.stop();
                    })
                    .error((response)=>{
                        $dialog.alert('Server Error occured while saving component.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.saveDashoardComponent.stop();
                    });
            }
        };
        $scope.initBlockUiBlocks = ()=>{
            $scope.blockUI = {
                saveDashoardComponent: blockUI.instances.get('saveDashoardComponent')
            };
        };
        $scope.init = ()=>{
            console.log('AdminComponentsEditController loaded!');
            $scope.initBlockUiBlocks();
            $scope.component = $stateParams.component;
            $scope.stateAction = $stateParams.stateAction;
            $scope.loadComponentDetails();
        };
        $scope.init();
    }
]);

admin.controller('AdminDashboardComponentsController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',(event,toState,toParams,fromState,fromParams,options)=>{
        if(toState.name === 'admin.components.dashboard' && fromState !== 'admin.components.dashboard.list'){
            event.preventDefault();
            $state.go('admin.components.dashboard.list');
        }
    });
    $scope.init = ()=>{
        console.log('AdminDashboardComponentsController loaded!');
        $state.go('admin.components.dashboard.list');
    };
    $scope.init();
}]);