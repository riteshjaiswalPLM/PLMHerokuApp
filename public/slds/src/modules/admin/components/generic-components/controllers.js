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
            '$scope','$state','$stateParams','$dialog','$adminLookups','sobjectService','blockUI','genericComponentService','$adminModals','ModalService',
    function($scope , $state , $stateParams , $dialog , $adminLookups , sobjectService , blockUI , genericComponentService , $adminModals , ModalService){
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
                $scope.component.ComponentDetails[0].configuration.addFinalApproverCriteria = criteria;
            });
        };
        $scope.openFieldCriteriaModal = function(field,index){
            var fields = {}
            fields[$scope.UserSObject.name+'-'+$scope.UserSObject.label] = $scope.UserSObject.SObjectFields;
    		fields[$scope.component.approvalDetailSObject.name+'-'+$scope.component.approvalDetailSObject.label] = $scope.component.approvalDetailSObject.SObjectFields;
			fields[$scope.component.SObject.name+'-'+$scope.component.SObject.label] = $scope.component.SObject.SObjectFields;
        	$adminModals.multiObjectCriteriaModal({
                title: 'Field Visible Criteria | ' + field.label,
                fields: fields,
                criteria: $scope.component.ComponentDetails[0].configuration.fields[index].criteria ? $scope.component.ComponentDetails[0].configuration.fields[index].criteria : null
            },function(criteria){
                $scope.component.ComponentDetails[0].configuration.fields[index].criteria = criteria;
            });
        };
        $scope.openComponentReadOnlyCriteriaModal = function(){
    		if(!$scope.component.approvalDetailSObject || !$scope.component.SObject){
    			$dialog.alert('SObject and Approval Detail SObject Are mandatory!','Error','pficon pficon-error-circle-o');
    			return;
    		}
    		var fields = {}
    		fields[$scope.UserSObject.name+'-'+$scope.UserSObject.label] = $scope.UserSObject.SObjectFields;
			fields[$scope.component.SObject.name+'-'+$scope.component.SObject.label] = $scope.component.SObject.SObjectFields;
			$adminModals.multiObjectCriteriaModal({
                title: 'Add Component Read Only Criteria',
                fields: fields,
                criteria: $scope.component.ComponentDetails[0].configuration.componentReadOnlyCriteria ? $scope.component.ComponentDetails[0].configuration.componentReadOnlyCriteria : null
            },function(criteria){
                $scope.component.ComponentDetails[0].configuration.componentReadOnlyCriteria = criteria;
            });
        };
        $scope.openApprovalDetailFieldListModel = function(fieldName, filter){
            if(!$scope.component.approvalDetailSObject || !$scope.component.SObject){
    			$dialog.alert('SObject and Approval Detail SObject Are mandatory!','Error','pficon pficon-error-circle-o');
    			return;
    		}
            ModalService.showModal({
                templateUrl: 'slds/views/directive/control/referencefield.html',
                controller:'FieldLookupController',
                inputs:{
                    data: {
                        title: 'Select approval detail field',
                        field: $scope.component.approvalDetailSObject.SObjectFields,
                        refSObject: $scope.component.approvalDetailSObject,
                        filter: filter
                    }  
                }
            }).then(function(modal){
                modal.element.modal();
                modal.close.then(function(referenceFieldObject){
                    $scope.component.ComponentDetails[0].configuration[fieldName] = angular.copy(referenceFieldObject);
                    if(fieldName === 'assignedRoleField'){
                        $scope.component.ComponentDetails[0].configuration.finalApproverPicklistValue = '';
                    }
                });
            });
        };
        $scope.openCycleFieldListModel = function(){
            if(!$scope.component.approvalDetailSObject || !$scope.component.SObject){
    			$dialog.alert('SObject and Approval Detail SObject Are mandatory!','Error','pficon pficon-error-circle-o');
    			return;
    		}
            ModalService.showModal({
                templateUrl: 'slds/views/directive/control/referencefield.html',
                controller:'FieldLookupController',
                inputs:{
                    data: {
                        title: 'Select SObject cycle field',
                        field: $scope.component.SObject.SObjectFields,
                        refSObject: $scope.component.SObject
                    }  
                }
            }).then(function(modal){
                modal.element.modal();
                modal.close.then(function(referenceFieldObject){
                    $scope.component.ComponentDetails[0].configuration.cycleField = referenceFieldObject;
                });
            });
        };
        $scope.onChangeReadonly = function(field){
            if(field.readOnly)
                field.isRequired=false;
        };
        $scope.onChangeRequired = function(field){
            if(field.isRequired)
                field.readOnly=false;
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
                criteria: $scope.component.ComponentDetails[0].configuration.fields[index].readOnlyCriteria ? $scope.component.ComponentDetails[0].configuration.fields[index].readOnlyCriteria : null
            },function(criteria){
            	$scope.component.ComponentDetails[0].configuration.fields[index].readOnlyCriteria = criteria;
            });
        };
        $scope.openFieldRequiredCriteriaModal = function(field,index){
        	var fields = {}
    		fields[$scope.component.approvalDetailSObject.name+'-'+$scope.component.approvalDetailSObject.label] = $scope.component.approvalDetailSObject.SObjectFields;
			fields[$scope.component.SObject.name+'-'+$scope.component.SObject.label] = $scope.component.SObject.SObjectFields;
        	$adminModals.multiObjectCriteriaModal({
                title: 'Field Required Criteria | ' + field.label,
                fields: fields,
                criteria: $scope.component.ComponentDetails[0].configuration.fields[index].requiredCriteria ? $scope.component.ComponentDetails[0].configuration.fields[index].requiredCriteria : null
            },function(criteria){
            	$scope.component.ComponentDetails[0].configuration.fields[index].requiredCriteria = criteria;
            });
        };
        $scope.loadComponentDetails = function(){
            if($scope.component.id !== undefined && !$scope.blockUI.layoutBlock.state().blocking){
                $scope.blockUI.layoutBlock.start('Loading component details...');
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
                                $scope.connectingFieldMap = {};
                            	$scope.component.approvalDetailSObject.SObjectFields.forEach(function(field){
                            		if(field.type === 'reference' && field.referenceTo){
                            			field.referenceTo.forEach(function(reference){
                                            if($scope.connectingFieldMap[reference] === undefined)
                                                $scope.connectingFieldMap[reference] = [];
                                            $scope.connectingFieldMap[reference].push(field)
                            				if($scope.referenceSObjectNames.indexOf(reference) === -1)
                            					$scope.referenceSObjectNames.push(reference);
                            			});
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
                        $scope.blockUI.layoutBlock.stop();
                    })
                    .error(function(response){
                        $dialog.alert('Server Error occured while loading component details.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.layoutBlock.stop();
                    });
            }
            else{
            	$scope.blockUI.layoutBlock.start('Loading user object details...');
            	genericComponentService.getUserSObject()
        		.success(function(response){
        			$scope.blockUI.layoutBlock.stop();
        			if(response.success === true){
        				$scope.UserSObject = response.data.userSObject;
        			}
        			else{
        				$dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
        			}
        		})
        		.error(function(){
        			$scope.blockUI.layoutBlock.stop();
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
                if(sObject !== undefined){
                    $scope.connectingFieldMap = {};
                    sObject.SObjectFields.forEach(function(field){
                		if(field.type === 'reference' && field.referenceTo){
                			field.referenceTo.forEach(function(reference){
                                if($scope.connectingFieldMap[reference] === undefined)
                                    $scope.connectingFieldMap[reference] = [];
                                $scope.connectingFieldMap[reference].push(field)
                				if($scope.referenceSObjectNames.indexOf(reference) === -1)
                					$scope.referenceSObjectNames.push(reference);
                			});
                		}
                    });
                }
                if(sObject === undefined){
                    $scope.component.approvalDetailSObject = sObject;
                }else if($scope.component.approvalDetailSObject == null || $scope.component.approvalDetailSObject.name !== sObject.name){
                    $scope.component.approvalDetailSObject = sObject;
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
                    label: field.label,
                    criteria: {
                        group: {
                            operator: '&&',
                            rules: []
                        }
                    },
                    requiredCriteria: {
                        group: {
                            operator: '&&',
                            rules: []
                        }
                    },
                    readOnlyCriteria: {
                        group: {
                            operator: '&&',
                            rules: []
                        }
                    }
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
    		if(!$scope.component.SObject){
    			$dialog.alert('Please select SObject.','Error','pficon pficon-error-circle-o');
    			return false;
    		}
    		if(!$scope.component.ComponentDetails[0].configuration.cycleField){
    			$dialog.alert('Please select cycle field.','Error','pficon pficon-error-circle-o');
    			return false;
    		}
            if(!$scope.component.ComponentDetails[0].configuration.approvalDetailCycleField){
    			$dialog.alert('Please select approval detail cycle field.','Error','pficon pficon-error-circle-o');
    			return false;
    		}
            if(!$scope.component.ComponentDetails[0].configuration.connectingField && $scope.component.ComponentDetails[0].configuration.connectingField !== null && $scope.component.ComponentDetails[0].configuration.connectingField === ""){
    			$dialog.alert('Please select relative field.','Error','pficon pficon-error-circle-o');
    			return false;
    		}
            if(!$scope.component.ComponentDetails[0].configuration.approvalDetailStatusField){
    			$dialog.alert('Please select approval detail status field.','Error','pficon pficon-error-circle-o');
    			return false;
    		}
            if(!$scope.component.ComponentDetails[0].configuration.assignedRoleField){
    			$dialog.alert('Please select assigned role field.','Error','pficon pficon-error-circle-o');
    			return false;
    		}
            if(!$scope.component.ComponentDetails[0].configuration.finalApproverPicklistValue && $scope.component.ComponentDetails[0].configuration.finalApproverPicklistValue !== null && $scope.component.ComponentDetails[0].configuration.finalApproverPicklistValue === ""){
    			$dialog.alert('Please select final/approval picklist value.','Error','pficon pficon-error-circle-o');
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
            return true;
        };
        $scope.saveComponent = function(){
            if(!$scope.blockUI.layoutBlock.state().blocking){
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
                	componentToSave.ComponentDetails[0].configuration.approvalDetailSObjectName = componentToSave.approvalDetailSObject.name;
                    if(componentToSave.ComponentDetails[0].configuration.allowAddMoreCriteria === undefined){
                        componentToSave.ComponentDetails[0].configuration.allowAddMoreCriteria = {group: { operator: '&&', rules: [] }};
                    }
                    if(componentToSave.ComponentDetails[0].configuration.deleteCriteria === undefined){
                        componentToSave.ComponentDetails[0].configuration.deleteCriteria = {group: { operator: '&&', rules: [] }};
                    }
                    if(componentToSave.ComponentDetails[0].configuration.recallCriteria === undefined){
                        componentToSave.ComponentDetails[0].configuration.recallCriteria = {group: { operator: '&&', rules: [] }};
                    }
                	delete componentToSave.approvalDetailSObject;
                }
                delete componentToSave.SObject;
                
                $scope.blockUI.layoutBlock.start('Saving component...');
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
                        $scope.blockUI.layoutBlock.stop();
                    })
                    .error(function(response){
                        $dialog.alert('Server Error occured while saving component.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.layoutBlock.stop();
                    });
            }
        };
        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                layoutBlock: blockUI.instances.get('saveComponent')
            };
        };
        $scope.init = function(){
            console.log('AdminComponentsEditController loaded!');
            $scope.initBlockUiBlocks();
            $scope.allowedExtentions=[]; 
            $scope.allowedExtentionsForPrime=[];
            $scope.referenceSObjectNames=[];
            $scope.picklistValues = [];
            $scope.component = $stateParams.component;
            $scope.stateAction = $stateParams.stateAction;
            $scope.ctrl = this;
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