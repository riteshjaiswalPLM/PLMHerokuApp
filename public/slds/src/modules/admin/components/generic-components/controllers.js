'use strict';

admin.controller('AdminGenericComponentsListController',[
            '$scope','$state','genericComponentService','blockUI','$dialog',
    function($scope , $state , genericComponentService , blockUI , $dialog){
        
        $scope.loadComponents = function(){
            if(!$scope.blockUI.loadComponents.state().blocking){
                $scope.blockUI.loadComponents.start('Loading components...');
                genericComponentService.loadComponent()
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
        $scope.deleteComponent = function(component){
            $dialog.confirm({
                title: 'Confirm delete ?',
                yes: 'Yes, Delete', no: 'Cancel',
                message: 'Are you sure to delete component for "'+ component.title +'" ?',
                class:'danger'
            },function(confirm){
                if(confirm){
                    $scope.blockUI.loadComponents.start('Deleting "'+component.title+'" component...');
                    genericComponentService.deleteComponent(component)
                        .success(function(response){
                            $scope.blockUI.loadComponents.stop();
                            if(response.success){
                                $scope.loadComponents();
                            }else{
                                $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                            }
                        })
                        .error(function (response) {
                            $scope.blockUI.loadComponents.stop();
                            $dialog.alert('Error occured while deleting component.','Error','pficon pficon-error-circle-o');
                        });
                }
            });
        };
        $scope.edit = function(component){
            $state.go('admin.components.generic.edit',{component: component,stateAction:'Edit'});
        };
        $scope.create = function(catagory){
            var component = {};
            component.catagory = catagory;
            $state.go('admin.components.generic.edit',{component: component,stateAction:'Create'});
        };
        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                loadComponents: blockUI.instances.get('loadComponents')
            };
        };
        $scope.init = function(){
            console.log('AdminComponentsListController loaded!');
            $scope.initBlockUiBlocks();
            $scope.loadComponents();
        };
        $scope.init();
    }
]);

admin.controller('AdminGenericComponentsEditController',[
            '$scope','$state','$stateParams','$dialog','$adminLookups','sobjectService','blockUI','genericComponentService',
    function($scope , $state , $stateParams , $dialog , $adminLookups , sobjectService , blockUI , genericComponentService ){
        
        $scope.loadComponentDetails = function(){
            if($scope.component.id !== undefined && !$scope.blockUI.saveComponent.state().blocking){
                $scope.blockUI.saveComponent.start('Loading component details...');
                genericComponentService.loadComponentDetails($scope.component)
                    .success(function(response){
                        if(response.success === true){
                            $scope.component = response.data.component;
                            if($scope.component.catagory === 'UploadAttachment'){
                                angular.forEach($scope.component.ComponentDetails[0].configuration.allowedExt.split(','),function(ext){
                                    $scope.allowedExtentions.push(ext);
                                });
                                
                                if($scope.component.ComponentDetails[0].configuration.allowAttachPrime != undefined && $scope.component.ComponentDetails[0].configuration.allowAttachPrime == true){
                                    angular.forEach($scope.component.ComponentDetails[0].configuration.allowedExtForPrime.split(','),function(ext){
                                        $scope.allowedExtentionsForPrime.push(ext);
                                    });
                                }
                            }
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
        };
        $scope.concatAllowedExtentionsForPrime= function (){
			$scope.component.ComponentDetails[0].configuration.allowedExtForPrime='';
			angular.forEach( $scope.allowedExtentionsForPrime,function(ext, key){
				$scope.component.ComponentDetails[0].configuration.allowedExtForPrime += ext;
				if($scope.allowedExtentionsForPrime.length-1 != key)
					$scope.component.ComponentDetails[0].configuration.allowedExtForPrime += ',';
			});
		};
        $scope.addAllowedExtentions = function(allowedExtentions,newValue){
            if(!newValue.startsWith(".")){
                newValue="."+newValue;
            }
            if(allowedExtentions.indexOf(newValue) == -1) {
                 allowedExtentions.push(newValue) 
            }
        }
		$scope.concatAllowedExtentions= function (){
			$scope.component.ComponentDetails[0].configuration.allowedExt='';
			angular.forEach( $scope.allowedExtentions,function(ext, key){
				$scope.component.ComponentDetails[0].configuration.allowedExt += ext;
				if($scope.allowedExtentions.length-1 != key)
					$scope.component.ComponentDetails[0].configuration.allowedExt += ',';
			});
		};
        $scope.openSObjectsLookup = function(){
            $adminLookups.sObject({
                criteria: {
                    includeFields: false
                }
            },function(sObject){
                if(sObject === undefined){
                    $scope.component.SObject = sObject;
                    $scope.component.SObjectLayoutFields = [];
                }else if($scope.component.SObject == null || $scope.component.SObject.name !== sObject.name){
                    $scope.component.SObject = sObject;
                    $scope.component.SObjectLayoutFields = [];
                    $scope.component.title = ($scope.component.title) ? $scope.component.title : sObject.labelPlural;
                }
            });
        };
        $scope.addToComponentFields = function(field){
            $scope.component.SObjectLayoutFields.push({
                SObjectField: field,
                type: 'SObject-Component-Field',
                label: field.label
            });
        };
        $scope.cancel = function(){
            $state.go('admin.components.generic.list');  
        };
        $scope.saveComponent = function(){
            if(!$scope.blockUI.saveComponent.state().blocking){
                var componentToSave = angular.copy($scope.component);
                componentToSave.sobjectname = componentToSave.SObject.name;
                componentToSave.SObjectId = componentToSave.SObject.id;
                // angular.forEach(componentToSave.SObjectLayoutFields,function(field){
                //     field.SObjectFieldId = field.SObjectField.id;
                //     delete field.SObjectField;
                // });
                delete componentToSave.SObject;
                console.info(componentToSave);
                
                $scope.blockUI.saveComponent.start('Saving component...');
                genericComponentService.saveComponent(componentToSave)
                    .success(function(response){
                        if(response.success === true){
                            if($scope.stateAction === 'Create'){
                                $dialog.confirm({
                                    title: 'Create more ?',
                                    yes: 'Yes', no: 'No, Thanks',
                                    message: 'Component created successfully. \nCreate more component ?',
                                    class:'primary'
                                },function(confirm){
                                    if(confirm){
                                        // CREATE MORE
                                        $scope.newCompnent = {}
                                        $scope.newCompnent.catagory = componentToSave.catagory;
                                        $scope.component = angular.copy($scope.newCompnent);
                                    }else{
                                        $state.go('admin.components.generic.list');
                                    }
                                });
                            }else{
                                $state.go('admin.components.generic.list');
                            }
                        }else{
                            $dialog.alert('Error occured while saving component.','Error','pficon pficon-error-circle-o');
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
        $scope.init = function(){
            console.log('AdminComponentsEditController loaded!');
            $scope.initBlockUiBlocks();
            $scope.allowedExtentions=[]; 
            $scope.allowedExtentionsForPrime=[];
            $scope.component = $stateParams.component;
            $scope.stateAction = $stateParams.stateAction;

            $scope.loadComponentDetails();
        };
        $scope.init();
    }
]);

admin.controller('AdminGenericComponentsController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        if(toState.name === 'admin.components.generic' && fromState !== 'admin.components.generic.list'){
            event.preventDefault();
            $state.go('admin.components.generic.list');
        }
    });
    $scope.init = function(){
        console.log('AdminGenericComponentsController loaded!');
        $state.go('admin.components.generic.list');
    };
    $scope.init();
}]);