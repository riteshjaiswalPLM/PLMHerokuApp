'use strict';

client.controller('MultiLevelApprovalController',[
			'$scope','$log','$http','$rootScope','blockUI','$stateParams','ModalService','$filter','$dialog','$appCache','MultiObjectCriteriaHelper',
	function($scope , $log , $http , $rootScope , blockUI , $stateParams , ModalService , $filter , $dialog , $appCache , MultiObjectCriteriaHelper){
		var componentBlock = blockUI.instances.get("MultiLevelApprovalComponentBlock");
		$scope.loadApprovalDetailList = function(){
			var dataObj = {
				selectFields: ['Id'],
				selectObj: '',
				whereClause: {}
			};
			// $scope.section.Component.ComponentDetails[0].configuration.fields.forEach(function(field) {
			// 	dataObj.selectFields.push(field.SObjectField.name);
			// 	if(field.SObjectField.type === 'reference'){
			// 		dataObj.selectFields.push(field.SObjectField.relationshipName + '.' + field.reference)
			// 	}
			// });
			dataObj.selectObj = $scope.section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName;
			dataObj.whereClause[$scope.section.Component.ComponentDetails[0].configuration.connectingField] = $scope.ctrl.stateParamData.record.Id;
			dataObj.whereClause[$scope.section.Component.ComponentDetails[0].configuration.approvalDetailCycleField.name] = $scope.ctrl.dataModel[$scope.section.Component.ComponentDetails[0].configuration.cycleField.name];
			componentBlock.start('Loading approver users items...');
			$http.post("/api/service/component/getapprovalhistory",dataObj)
				.success(function(response){
					componentBlock.stop();
					if(response.success === true){
						$scope.dataModelList = response.data.dataModelList;
						$scope.dataModelList.forEach(function(dataModel){
							dataModel.deleted = false;
						});
					}
					else{
						$dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
					}
				})
				.error(function(){
					componentBlock.stop();
					$dialog.alert('Server error occured while loading details.','Error','pficon pficon-error-circle-o');
				});
		};
		$scope.isCriteriaValidAllObjects = function(from, criteria, model, parentModel){
			var dataModel = {};
			dataModel[$scope.userObj.attributes.type] = $scope.userObj;
			if(model){
				if(!model.attributes){
					dataModel[$scope.section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName] = model;
				}
				else{
					dataModel[model.attributes.type] = model;
				}
			}
			if(parentModel){
				dataModel[parentModel.attributes.type] = parentModel
			}	
			return MultiObjectCriteriaHelper.validate(criteria, dataModel)
		};
		$scope.addItems = function(){
			var newRow = {}
			$scope.section.Component.ComponentDetails[0].configuration.fields.forEach(function(field){
				if(!newRow[field.SObjectField.name]){
					newRow[field.SObjectField.name] = (field.data[field.SObjectField.name] === undefined ? null : field.data[field.SObjectField.name]);
					if(field.SObjectField.type === 'reference'){
						if(field.SObjectField.reference === undefined){
							newRow[field.SObjectField.relationshipName] = (field.data[field.SObjectField.relationshipName] === undefined ? null : field.data[field.SObjectField.relationshipName]);
						}else{
							var refField=field.SObjectField.reference;
							newRow[field.SObjectField.relationshipName]={refField	 :null};
						}
					}
				}
			});
			newRow.recalled = false;
			newRow.deleted = false;
			$scope.dataModelList.push(newRow);
		};
		$scope.ctrl.MultiLevelApprovalSave= function(){
			$scope.saveApprover();
		};
		$scope.isValid = function () {
			var errorMessages = {};
			var requiredFieldMissingArray = [];
			var assignedRoleFieldPresent = false, exceptionFound = false;
			angular.forEach($scope.dataModelList, function(dataModel){
				$scope.section.Component.ComponentDetails[0].configuration.fields.forEach(function(field){
					if(field.SObjectField.name === $scope.section.Component.ComponentDetails[0].configuration.assignedRoleField.name){
						assignedRoleFieldPresent = true;
					}
					if(field.isRequired === true && $scope.isCriteriaValidAllObjects('from save approvers.', field.requiredCriteria, dataModel, $scope.ctrl.dataModel) && (dataModel[field.SObjectField.name] === null || dataModel[field.SObjectField.name] === undefined)){
						requiredFieldMissingArray.push(field.label);
					}
				});
			});
			if(requiredFieldMissingArray.length > 0){
				exceptionFound = true;
				errorMessages[requiredFieldMissingArray.length] = 'Some required fields are missing.\nPlease fill the required information.'
			}
			if($scope.section.Component.ComponentDetails[0].configuration.allowAddFinalApprover === true && $scope.isCriteriaValidAllObjects('from allow add final approver criteria.', $scope.section.Component.ComponentDetails[0].configuration.addFinalApproverCriteria, $scope.ctrl.dataModel)){
				var finalApproverCount = 0
				if(assignedRoleFieldPresent){
					$scope.dataModelList.forEach(function(dataModel){
						if(dataModel[$scope.section.Component.ComponentDetails[0].configuration.assignedRoleField.name] === $scope.section.Component.ComponentDetails[0].configuration.finalApproverPicklistValue) finalApproverCount++;
					});
				}
				if(finalApproverCount > $scope.section.Component.ComponentDetails[0].configuration.finalApproverAllowedCount){
					exceptionFound = true;
					errorMessages['finalApproverAllowedCount'] = 'You are not allowed to add '+ $scope.section.Component.ComponentDetails[0].configuration.finalApproverPicklistValue +' more than '+ $scope.section.Component.ComponentDetails[0].configuration.finalApproverAllowedCount +'.\nPlease remove some approver(s) or change the role.';
				}
			}
			else{
				var finalApproverAddedArr = [];
				$scope.dataModelList.forEach(function(dataModel){
					if(dataModel[$scope.section.Component.ComponentDetails[0].configuration.assignedRoleField.name] === $scope.section.Component.ComponentDetails[0].configuration.finalApproverPicklistValue) finalApproverAddedArr.push(dataModel);
				});
				if(finalApproverAddedArr.length > 0){
					exceptionFound = true;
					errorMessages['finalApproverAddedArr'] = 'You are not allowed to add '+ $scope.section.Component.ComponentDetails[0].configuration.finalApproverPicklistValue + '.\nPlease remove approver or change the role.';
				}
			}
			if(!exceptionFound)
				return "";
			else{
				var errorMessagesStr = "";
				angular.forEach(errorMessages, function(error,key) {
					errorMessagesStr += error + "</br>";
				});
				return errorMessagesStr;
			}
		};
		$scope.ctrl.MultiLevelApprovalValidate= function(callback){
			var message=$scope.isValid();
			if(message===""){
				callback({
					success: true,
					message: "success"
				});	
			}else{
				callback({
					success: false,
					message: message
				});
			}
		};
		$scope.isComponentValid = function(){
			var errorMessagesStr=$scope.isValid();
			if(errorMessagesStr === ""){
				return true;
			}
			else{
				$dialog.alert(errorMessagesStr,'Validation Alert','pficon-warning-triangle-o');
				return false;
			}
		};
		$scope.saveApprover = function(){
			if($scope.isComponentValid()){
				$scope.dataModelList.forEach(function(dataModel){
					Object.keys(dataModel).forEach(function(apiName){
						if($scope.fieldList.indexOf(apiName) === -1){
							delete dataModel[apiName];
						}
					});
				});
				angular.forEach($scope.dataModelList, function(dataModel){
					if(dataModel['Id'] === undefined){
						dataModel[$scope.section.Component.ComponentDetails[0].configuration.approvalDetailCycleField.name] = $scope.ctrl.dataModel[$scope.section.Component.ComponentDetails[0].configuration.cycleField.name]
					}
					dataModel[$scope.section.Component.ComponentDetails[0].configuration.connectingField] = $scope.ctrl.stateParamData.record.Id;
				});
				componentBlock.start('Saving approver(s)...');
				var dataObj = {
					dataModelList: $scope.dataModelList,
					sObject: $scope.section.Component.ComponentDetails[0].configuration.approvalDetailSObjectName,
					approvalDetailStatusAPI : $scope.section.Component.ComponentDetails[0].configuration.approvalDetailStatusField.name
				};
				$http.post("/api/service/component/saveapprovers",dataObj)
					.success(function(response){
						componentBlock.stop();
						if(response.success === true){
						}
						else{
							$dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
						}
						$scope.loadApprovalDetailList();
					})
					.error(function(){
						componentBlock.stop();
						$dialog.alert('Server error occured while saving approvers.','Error','pficon pficon-error-circle-o');
						$scope.loadApprovalDetailList();
					});
			}
		};
		$scope.initReadonlyAndRequired = function(field, dataModel){
			field.required = field.isRequired === true && $scope.isCriteriaValidAllObjects('from initReadonlyAndRequired - required.', field.requiredCriteria, dataModel, $scope.ctrl.dataModel); 
			field.readonly = field.readOnly === true && $scope.isCriteriaValidAllObjects('from initReadonlyAndRequired - required.', field.readOnlyCriteria, dataModel, $scope.ctrl.dataModel);
		};
		$scope.init = function(){
			console.log('MultiLevelApprovalController loaded...');
			$scope.loadApprovalDetailList();
			$scope.userObj = JSON.parse($rootScope.user().userdata);
			$scope.fieldList = ['Id', 'deleted', 'recalled'];
			$scope.section.Component.name = $scope.section.componentName;
			$scope.section.Component.ComponentDetails[0].configuration.fields.forEach(function(field){
				$scope.fieldList.push(field.SObjectField.name);
			});
			if($scope.type !== 'detail' && $scope.section.Component.ComponentDetails[0].configuration.readonly === true){
				$scope.section.readonly = $scope.isCriteriaValidAllObjects('from init - component read only.', $scope.section.Component.ComponentDetails[0].configuration.componentReadOnlyCriteria, $scope.ctrl.dataModel);
			}
		};
		$scope.init();
	}
]);