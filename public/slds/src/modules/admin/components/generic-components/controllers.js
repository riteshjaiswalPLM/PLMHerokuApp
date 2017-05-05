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
                message: 'Are you sure to delete component for "'+ component.title +'" ?Deleting component will remove it from everywhere, where ever it\'s used.',
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
            '$scope','$state','$stateParams','$dialog','$adminLookups','sobjectService','blockUI','genericComponentService','$adminModals',
    function($scope , $state , $stateParams , $dialog , $adminLookups , sobjectService , blockUI , genericComponentService , $adminModals){
    	$scope.openAddMoreCriteriaModal = function(){
    		if(!$scope.component.approvalDetailSObject || !$scope.component.SObject){
    			$dialog.alert('SObject and Approval Detail SObject Are mandatory!','Error','pficon pficon-error-circle-o');
    			return;
    		}
    		var fields = {}
    		fields[$scope.UserSObject.name+'-'+$scope.UserSObject.label] = $scope.UserSObject.SObjectFields;
			fields[$scope.component.SObject.name+'-'+$scope.component.SObject.label] = $scope.component.SObject.SObjectFields;
            $adminModals.multiObjectCriteriaModal({
                title: 'Add More Criteria',
                fields: fields,
                criteria: $scope.component.ComponentDetails[0].configuration.allowAddMoreCriteria ? $scope.component.ComponentDetails[0].configuration.allowAddMoreCriteria : null
            },function(criteria){
                $scope.component.ComponentDetails[0].configuration.allowAddMoreCriteria = criteria;
            });
        };
        $scope.openAddFinalApproverCriteriaModal = function(){
    		if(!$scope.component.approvalDetailSObject || !$scope.component.SObject){
    			$dialog.alert('SObject and Approval Detail SObject Are mandatory!','Error','pficon pficon-error-circle-o');
    			return;
    		}
    		var fields = {}
    		fields[$scope.UserSObject.name+'-'+$scope.UserSObject.label] = $scope.UserSObject.SObjectFields;
			fields[$scope.component.SObject.name+'-'+$scope.component.SObject.label] = $scope.component.SObject.SObjectFields;
    		$adminModals.multiObjectCriteriaModal({
                title: 'Add Final Approver Criteria',
                fields: fields,
                criteria: $scope.component.ComponentDetails[0].configuration.addFinalApprover ? $scope.component.ComponentDetails[0].configuration.addFinalApprover : null
            },function(criteria){
                $scope.component.ComponentDetails[0].configuration.addFinalApprover = criteria;
            });
        };
        $scope.openRecallCriteriaModal = function(){
    		if(!$scope.component.approvalDetailSObject || !$scope.component.SObject){
    			$dialog.alert('SObject and Approval Detail SObject Are mandatory!','Error','pficon pficon-error-circle-o');
    			return;
    		}
    		var fields = {}
    		fields[$scope.UserSObject.name+'-'+$scope.UserSObject.label] = $scope.UserSObject.SObjectFields;
			fields[$scope.component.SObject.name+'-'+$scope.component.SObject.label] = $scope.component.SObject.SObjectFields;
			fields[$scope.component.approvalDetailSObject.name+'-'+$scope.component.approvalDetailSObject.label] = $scope.component.approvalDetailSObject.SObjectFields;
    		$adminModals.multiObjectCriteriaModal({
                title: 'Recall Criteria',
                fields: fields,
                criteria: $scope.component.ComponentDetails[0].configuration.recallCriteria ? $scope.component.ComponentDetails[0].configuration.recallCriteria : null
            },function(criteria){
                $scope.component.ComponentDetails[0].configuration.recallCriteria = criteria;
            });
        };
        $scope.openDeleteCriteriaModal = function(){
    		if(!$scope.component.approvalDetailSObject || !$scope.component.SObject){
    			$dialog.alert('SObject and Approval Detail SObject Are mandatory!','Error','pficon pficon-error-circle-o');
    			return;
    		}
    		var fields = {}
    		fields[$scope.UserSObject.name+'-'+$scope.UserSObject.label] = $scope.UserSObject.SObjectFields;
			fields[$scope.component.SObject.name+'-'+$scope.component.SObject.label] = $scope.component.SObject.SObjectFields;
			fields[$scope.component.approvalDetailSObject.name+'-'+$scope.component.approvalDetailSObject.label] = $scope.component.approvalDetailSObject.SObjectFields;
            $adminModals.multiObjectCriteriaModal({
                title: 'Delete Criteria',
                fields: fields,
                criteria: $scope.component.ComponentDetails[0].configuration.deleteCriteria ? $scope.component.ComponentDetails[0].configuration.deleteCriteria : null
            },function(criteria){
                $scope.component.ComponentDetails[0].configuration.deleteCriteria = criteria;
            });
        };
        $scope.openFieldReadOnlyCriteriaModal = function(field,index){
        	var fields = {}
    		fields[$scope.component.approvalDetailSObject.name+'-'+$scope.component.approvalDetailSObject.label] = $scope.component.approvalDetailSObject.SObjectFields;
			fields[$scope.component.SObject.name+'-'+$scope.component.SObject.label] = $scope.component.SObject.SObjectFields;
        	$adminModals.multiObjectCriteriaModal({
                title: 'Field Read Only Criteria | ' + field.label,
                fields: fields,
                criteria: $scope.component.ComponentDetails[0].configuration.fields[index].criteria ? $scope.component.ComponentDetails[0].configuration.fields[index].criteria : null
            },function(criteria){
            	$scope.component.ComponentDetails[0].configuration.fields[index].criteria = criteria;
            });
        };
        $scope.openFieldRequiredCriteriaModal = function(field,index){
        	var fields = {}
    		fields[$scope.component.approvalDetailSObject.name+'-'+$scope.component.approvalDetailSObject.label] = $scope.component.approvalDetailSObject.SObjectFields;
			fields[$scope.component.SObject.name+'-'+$scope.component.SObject.label] = $scope.component.SObject.SObjectFields;
        	$adminModals.multiObjectCriteriaModal({
                title: 'Field Required Criteria | ' + field.label,
                fields: fields,
                criteria: $scope.component.ComponentDetails[0].configuration.fields[index].criteria ? $scope.component.ComponentDetails[0].configuration.fields[index].criteria : null
            },function(criteria){
            	$scope.component.ComponentDetails[0].configuration.fields[index].criteria = criteria;
            });
        };
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
                            if($scope.component.catagory === 'MultiLevelApproval'){
                            	$scope.refSObjects = response.data.refSObjects;
                            	$scope.component.approvalDetailSObject.SObjectFields.forEach(function(field){
                            		if(field.type === 'reference' && field.referenceTo){
                            			field.referenceTo.forEach(function(reference){
                            				if($scope.referenceSObjectNames.indexOf(reference) === -1)
                            					$scope.referenceSObjectNames.push(reference);
                            			})
                            		}
                                });
                            	genericComponentService.getUserSObject()
                            		.success(function(response){
                            			if(response.success === true){
                            				$scope.UserSObject = response.data.userSObject;
                            			}
                            			else{
                            				$dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                            			}
                            		})
                            		.error(function(){
                            			$dialog.alert('Server Error occured while loading component details.','Error','pficon pficon-error-circle-o');
                            		});
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
            else{
            	$scope.blockUI.saveComponent.start('Loading user object details...');
            	genericComponentService.getUserSObject()
        		.success(function(){
        			$scope.blockUI.saveComponent.stop();
        			if(response.success === true){
        				$scope.UserSObject = response.data.userSObject;
        			}
        			else{
        				$dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
        			}
        		})
        		.error(function(){
        			$scope.blockUI.saveComponent.stop();
        			$dialog.alert('Server Error occured while loading component details.','Error','pficon pficon-error-circle-o');
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
        	var whereClause = {
                criteria: {
                    includeFields: true
                }
            };
        	if($scope.component.catagory === 'MultiLevelApproval' && !$scope.component.approvalDetailSObject){
        		$dialog.alert('Please select Approval Detail SObject.','Error','pficon pficon-error-circle-o');
        		return;
        	}
        	else{
        		whereClause.criteria.referenceSObjectNames = $scope.referenceSObjectNames;
        	}
            $adminLookups.sObject(whereClause,function(sObject){
            	if(sObject === undefined){
                    $scope.component.SObject = sObject;
                    $scope.component.ComponentDetails[0].configuration.fields = [];
                }else if($scope.component.SObject == null || $scope.component.SObject.name !== sObject.name){
                    $scope.component.SObject = sObject;
                    $scope.component.ComponentDetails[0].configuration.fields = [];
                    if($scope.component.catagory === 'MultiLevelApproval'){
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
                    $scope.component.SObjectLayoutFields = [];
                    $scope.component.title = ($scope.component.title) ? $scope.component.title : sObject.labelPlural;
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
        $scope.openApprovalDetailSObjectsLookup = function(){
        	$adminLookups.sObject({
                criteria: {
                    includeFields: true
                }
            },function(sObject){
            	$scope.component.SObject = undefined;
            	$scope.component.ComponentDetails[0].configuration.fields = [];
                if(sObject === undefined){
                    $scope.component.approvalDetailSObject = sObject;
                }else if($scope.component.approvalDetailSObject == null || $scope.component.approvalDetailSObject.name !== sObject.name){
                    $scope.component.approvalDetailSObject = sObject;
                    sObject.SObjectFields.forEach(function(field){
                		if(field.type === 'reference' && field.referenceTo){
                			field.referenceTo.forEach(function(reference){
                				if($scope.referenceSObjectNames.indexOf(reference) === -1)
                					$scope.referenceSObjectNames.push(reference);
                			})
                		}
                    });
                }
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
            $state.go('admin.components.generic.list');  
        };
        $scope.validateComponentBeforeSave = function(){
        	if(!$scope.component.approvalDetailSObject){
    			$dialog.alert('Please select Approval Detail SObject.','Error','pficon pficon-error-circle-o');
    			return false;
    		}
    		if(!$scope.component.approvalDetailSObject){
    			$dialog.alert('Please select SObject.','Error','pficon pficon-error-circle-o');
    			return false;
    		}
    		if($scope.component.ComponentDetails[0].configuration.fields.length === 0){
    			$dialog.alert('No fields added in field list.\nPlease add some fields.','Error','pficon pficon-error-circle-o');
    			return false;
    		}
    		var duplicate = false;
            angular.forEach($scope.component.ComponentDetails[0].configuration.fields,function(field, index){
                if(field.SObjectField.type === 'reference'){
                    angular.forEach($scope.component.ComponentDetails[0].configuration.fields,function(_field, _index){
                        if(_field.SObjectField.type === 'reference'){
                            if(!duplicate){
                                if(_index !== index && _field.SObjectField.id === field.SObjectField.id && _field.reference === field.reference){
                                    duplicate = true;
                                }
                            }
                        }
                    });
                }
            });
            if(duplicate === true){
                $dialog.alert('Duplicate field found in reference.','Error','pficon pficon-error-circle-o');
                return false;
            }
            else{
            	return true;
            }
        };
        $scope.saveComponent = function(){
            if(!$scope.blockUI.saveComponent.state().blocking){
            	if($scope.component.catagory === 'MultiLevelApproval'){
            		if(!$scope.validateComponentBeforeSave()){
            			return;
            		}
            		if($scope.component.ComponentDetails[0].configuration.allowAddFinalApprover === true && $scope.component.ComponentDetails[0].configuration.finalApproverAllowedCount === undefined){
            			$dialog.alert('Please enter final approver count.','Error','pficon pficon-error-circle-o');
            			return;
            		}
            	}
                var componentToSave = angular.copy($scope.component);
                componentToSave.sobjectname = componentToSave.SObject.name;
                componentToSave.SObjectId = componentToSave.SObject.id;
                if($scope.component.catagory === 'MultiLevelApproval'){
                	componentToSave.approvalDetailSObjectId = componentToSave.approvalDetailSObject.id; 
                	componentToSave.approvalDetailSObjectName = componentToSave.approvalDetailSObject.name;
                	delete componentToSave.approvalDetailSObject;
                }
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
            $scope.referenceSObjectNames=[];
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