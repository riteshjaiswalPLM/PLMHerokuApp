'use strict';

admin.controller('AdminDashboardComponentsListController',[
            '$scope','$state','genericComponentService','blockUI','$dialog',
    function($scope , $state , genericComponentService , blockUI , $dialog){
        
        $scope.loadComponents = function(){
            if(!$scope.blockUI.loadComponents.state().blocking){
                $scope.blockUI.loadComponents.start('Loading components...');
                genericComponentService.loadDashboardComponent({forMobile: $scope.forMobile})
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
                message: 'Are you sure to delete component for "'+ component.title +'" ?\nDeleting component will remove it from everywhere, where ever it\'s used.',
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
                        .error(function(response){
                            $scope.blockUI.loadComponents.stop();
                            $dialog.alert('Error occured while deleting component.','Error','pficon pficon-error-circle-o');
                        });
                }
            });
        };
        $scope.onChangeHidden = function(field){
            if(field.hidden)
                field.hidden = false;
        };
        $scope.edit = function(component){
            $state.go($state.current.name.replace(/.list/g, '.edit'),{component: component,stateAction:'Edit', redirectTo: $state.current.name});
        };
        $scope.create = function(catagory){
            var component = {};
            component.catagory = catagory;
            $state.go($state.current.name.replace(/.list/g, '.edit'),{component: component,stateAction:'Create', redirectTo: $state.current.name});
        };
        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                loadComponents: blockUI.instances.get('loadComponents')
            };
        };
        $scope.init = function(){
            console.log('AdminDashboardComponentsListController loaded!');
            if($state.current.name.indexOf('mobile.mytask') > -1){
                $state.current.title = 'Mobile My Task Components';
            }
            else{
                $state.current.title = 'Dashboard Components';
            }
            if(angular.isUndefined($scope.forMobile)){
                $scope.forMobile = false;
            }
            $scope.initBlockUiBlocks();
            $scope.loadComponents();
        };
        $scope.init();
    }
]);

admin.controller('AdminDashboardComponentsEditController',[
            '$scope','$state','$stateParams','$dialog','$adminLookups','sobjectService','blockUI','genericComponentService',
    function($scope , $state , $stateParams , $dialog , $adminLookups , sobjectService , blockUI , genericComponentService ){
        
        $scope.loadComponentDetails = function(){
            if($scope.component.id !== undefined && !$scope.blockUI.saveDashoardComponent.state().blocking){
                $scope.blockUI.saveDashoardComponent.start('Loading component details...');
                genericComponentService.loadComponentDetails($scope.component)
                    .success(function(response){
                        $scope.blockUI.saveDashoardComponent.stop();
                        if(response.success === true){
                            $scope.component = response.data.component;
                            $scope.refSObjects = response.data.refSObjects;
                            $scope.sObjectFields = angular.copy(response.data.component.SObject.SObjectFields);
                            if($scope.component.detailSObject && $scope.component.SObject){
	                            angular.forEach($scope.component.SObject.SObjectFields,function(field){
	                        		if(field.type === 'reference' && field.referenceTo.indexOf($scope.component.detailSObject.name) !== -1){
	                        			$scope.relativeFields.push(field);
	                        		}
	                        	});
                            }
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                    })
                    .error(function(response){
                        $dialog.alert('Server Error occured while loading component details.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.saveDashoardComponent.stop();
                    });
            } 
        };
        $scope.openSObjectsLookup = function(SObject){
            $adminLookups.sObject({
                criteria: {
                    includeFields: true
                }
            },function(sObject){
                if(!$scope.component.hasOwnProperty('ComponentDetails')){
                    $scope.component.ComponentDetails = [];
                    if($scope.component.ComponentDetails.length === 0){
                        $scope.component.ComponentDetails.push({});
                        $scope.component.ComponentDetails[0].configuration = {};
                    }
                }
                if(SObject !== 'detailSObject'){
                    if(sObject === undefined){
                        $scope.component.SObject = sObject;
                        $scope.component.ComponentDetails[0].configuration.fields = [];
                    }else if($scope.component.SObject == null || $scope.component.SObject.name !== sObject.name){
                        $scope.component.SObject = sObject;
                        $scope.component.ComponentDetails[0].configuration.fields = [];
                        $scope.sObjectFields = angular.copy(sObject.SObjectFields);
                        $scope.component.title = ($scope.component.title) ? $scope.component.title : sObject.labelPlural;
                        var referenceSObjectNames = [];
                        sObject.SObjectFields.forEach(function(field){
                        	if(field.type === 'reference'){
                        		field.referenceTo.forEach(function(reference){
                        			if(referenceSObjectNames.indexOf(reference) === -1){
                        				referenceSObjectNames.push(reference);
                        			}
                        		});
                        	}
                        });
                        if(referenceSObjectNames.length > 0){                    	
                        	$scope.loadRefSObject(referenceSObjectNames);
                        }
                    }
                }
                else{
                	$scope.component.detailSObject = sObject;
                }
                $scope.relativeFields = [];
                if($scope.component.detailSObject && $scope.component.SObject){                	
                	angular.forEach($scope.component.SObject.SObjectFields,function(field){
                		if(field.type === 'reference' && field.referenceTo.indexOf($scope.component.detailSObject.name) !== -1){
                			$scope.relativeFields.push(field);
                		}
                	});
                }
            });
        };
        $scope.loadRefSObject = function(referenceSObjectNames){
        	genericComponentService.loadRefSObject({referenceSObjectNames: referenceSObjectNames})
        		.success(function(response){
        			if(response.success === true)
        				$scope.refSObjects = response.data.refSObjects; 
        		});
        };
        $scope.addToComponentFields = function(field){
            var duplicate = [];
            $scope.component.ComponentDetails[0].configuration.fields.forEach(function(_field){
                if(_field.SObjectField.name === field.name){
                    duplicate.push(_field);
                }
            });
            if(duplicate.length === 0 || field.type === 'reference'){
                $scope.component.ComponentDetails[0].configuration.fields.push({
                    SObjectField: field,
                    label: field.label
                });
            }
            if(duplicate.length > 0 && duplicate[0].SObjectField.type.toLowerCase() !== 'reference'){
                $dialog.alert('You cannot insert duplicate field.','Error','pficon pficon-error-circle-o');
            }
        };
        $scope.cancel = function(){
            $state.go($stateParams.redirectTo);  
        };
        $scope.saveComponent = function(){
            if(!$scope.blockUI.saveDashoardComponent.state().blocking){
                var duplicate = false;
                angular.forEach($scope.component.ComponentDetails[0].configuration.fields,function(field, index){
                    if(field.SObjectField.type === 'reference'){
                        angular.forEach($scope.component.ComponentDetails[0].configuration.fields,function(_field, _index){
                            if(_field.SObjectField.type === 'reference'){
                                if(!duplicate){
                                    if(_field.reference && field.reference && _index !== index && _field.SObjectField.id === field.SObjectField.id && _field.reference === field.reference){
                                        duplicate = true;
                                    }
                                    if(_field.referenceRemoved && field.referenceRemoved && _field.referenceRemoved === true && field.referenceRemoved === true && _index !== index && _field.SObjectField.id === field.SObjectField.id){
                                        duplicate = true;
                                    }
                                }
                            }
                        });
                    }
                });
                if(duplicate === true){
                    $dialog.alert('Duplicate field found in reference.','Error','pficon pficon-error-circle-o');
                    return;
                }
                var componentToSave = angular.copy($scope.component);
                componentToSave.sobjectname = componentToSave.SObject.name;
                componentToSave.SObjectId = componentToSave.SObject.id;
                componentToSave.detailSObjectId = null;
                if(componentToSave.detailSObject){                	
                	componentToSave.detailSObjectId = componentToSave.detailSObject.id;
                }
                // else{
                //     delete componentToSave.ComponentDetails[0].configuration.relativeField;
                // }
                componentToSave.forMobile = $scope.forMobile;
                delete componentToSave.SObject;
                
                $scope.blockUI.saveDashoardComponent.start('Saving component...');
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
                                        $state.go($stateParams.redirectTo);
                                    }
                                });
                            }else{
                                $state.go($stateParams.redirectTo);
                            }
                        }else{
                            $dialog.alert('Error occured while saving component.','Error','pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.saveDashoardComponent.stop();
                    })
                    .error(function(response){
                        $dialog.alert('Server Error occured while saving component.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.saveDashoardComponent.stop();
                    });
            }
        };
        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                saveDashoardComponent: blockUI.instances.get('SaveDashoardComponentBlockUI')
            };
        };
        $scope.init = function(){
            console.log('AdminComponentsEditController loaded!');
            $scope.initBlockUiBlocks();
            $scope.relativeFields = [];
            $scope.component = $stateParams.component;
            $scope.stateAction = $stateParams.stateAction;
            $scope.loadComponentDetails();
        };
        $scope.init();
    }
]);

admin.controller('AdminDashboardComponentsController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        if(toState.name === 'admin.components.dashboard' && fromState !== 'admin.components.dashboard.list'){
            event.preventDefault();
            $state.go('admin.components.dashboard.list');
        }
    });
    $scope.init = function(){
        console.log('AdminDashboardComponentsController loaded!');
        $state.go('admin.components.dashboard.list');
    };
    $scope.init();
}]);