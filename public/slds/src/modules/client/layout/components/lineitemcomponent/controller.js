'use strict';

client.controller('LineItemComponentController',[
			'$scope','$log','$http','$rootScope','blockUI','$stateParams','ModalService','$filter','$dialog','$appCache','CriteriaHelper',
	function($scope , $log , $http , $rootScope , blockUI , $stateParams , ModalService , $filter , $dialog,$appCache,CriteriaHelper){
// 		    var errorMessages = [];
		var currencyFilter = $filter('currencyFilter');
		var componentBlock = blockUI.instances.get("LineItemComponentBlock"+$scope.section.id);
		$scope.loadLineItems = function(){
			componentBlock.start('Loading line items...');
				$scope.invoiceData = {
						invoiceId :$scope.ctrl.stateParamData.record.Id,
						componentConfig :$scope.section.Component,
						fields:angular.copy($scope.section.columns[0]),
						rowLevelCriteria: CriteriaHelper.criteriaCondition($scope.section.componentConfig.rowLevelCriteria)
				};
				
				$scope.invoiceAmount = 0.0;
				$http.post("/api/service/component/getlineitemdata",$scope.invoiceData)
					.success(function(response){
						if(response.success){
							angular.forEach(response.data.dataModelList, function(model, key){
								response.data.dataModelList[key].isRemovable = true;
								response.data.dataModelList[key].isPersisted = true;
								response.data.dataModelList[key].isDeleted = false;
							});
							$scope.dataModelList = response.data.dataModelList;
							
							componentBlock.stop();
						}else{
							$dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
							componentBlock.stop();
						}
					})
					.error(function(){
						componentBlock.stop();
						$dialog.alert('Server error occured while loading details.','Error','pficon pficon-error-circle-o');
					});
		};
		
		$scope.addItems = function(){	// addItem()
			$scope.newfields={};
			$scope.invoiceData.fields.forEach(function(field){
				if(!$scope.newfields[field.SObjectField.name]){
					if(field.defaultValue!=null && (""+field.defaultValue).indexOf("{")!=-1){
                        if(field.defaultValue.indexOf("}") !=-1 && $scope.$parent.$parent.$parent.model[field.defaultValue.substring(1,field.defaultValue.indexOf("}"))]!=null){
                            field.defaultValue=$scope.$parent.$parent.$parent.model[field.defaultValue.substring(1,field.defaultValue.indexOf("}"))]
                        }
						else{
							field.defaultValue="";
						}
                    }
					$scope.newfields[field.SObjectField.name]=field.defaultValue;
					if (field.SObjectField.type == "double") {
						if (field.defaultValue != undefined && field.defaultValue != null) {
							field.defaultValue=$scope.newfields[field.SObjectField.name] = parseFloat(field.defaultValue);
							$scope.newfields[field.SObjectField.name] = parseFloat(field.defaultValue);
							
						}
					}
					if (field.SObjectField.type == "int") {
						if (field.defaultValue != undefined && field.defaultValue != null) {
							$scope.newfields[field.SObjectField.name] = parseInt(field.defaultValue);
						}
					}
					if (field.SObjectField.type == "boolean") {
						if (field.defaultValue != undefined && field.defaultValue != null && (typeof field.defaultValue === 'string')) {
							$scope.newfields[field.SObjectField.name] = (field.defaultValue == 'true')?true:false;
						}
						else{
							$scope.newfields[field.SObjectField.name]=(field.defaultValue != undefined)?field.defaultValue:false;
						}
					}
					
					if(field.SObjectField.type === 'reference'){
						if(field.SObjectField.reference === undefined){
							$scope.newfields[field.SObjectField.relationshipName]={'Name':field.defaultValueLabel};
						}else{
							var refField=field.SObjectField.reference;
							$scope.newfields[field.SObjectField.relationshipName]={refField	 :field.defaultValueLabel};
						}
					}
				}
			});

			$scope.newfields["isRemovable"] = true;
			$scope.newfields["isPersisted"] = false;
			$scope.newfields["isDeleted"] = false;
			$scope.dataModelList.push($scope.newfields);
			
		};
		$scope.isValid = function () {
			var errorMessages = {};
			var fieldRequire=false;
			angular.forEach($scope.dataModelList,function(model){
				if(model.isDeleted == false){
					angular.forEach($scope.invoiceData.fields,function(sObject){
						if(sObject.hidden==false && sObject.required && (model[sObject.SObjectField.name] == null || model[sObject.SObjectField.name] == '' )){
							errorMessages[sObject.label]=sObject.label +" must be required.";
							fieldRequire=true;
						}
						// if(sObject.rendered===false){
						// 	delete model[sObject.SObjectField.name];
						// 	if(sObject.SObjectField.type === 'reference'){
						// 		delete model[sObject.SObjectField.relationshipName];
						// 	}
						// }
					});
				}
				
			});
			if(!fieldRequire){
				var criteriaSum = {};
				angular.forEach($scope.dataModelList, function (model, mindex) {
					angular.forEach($scope.section.componentConfig.sectionComponentAmtFields, function (field, findex) {
						if (criteriaSum[field.childSObjectField.name + '-' + findex] === undefined || criteriaSum[field.childSObjectField.name + '-' + findex] === null) {
							criteriaSum[field.childSObjectField.name + '-' + findex] = 0;
						}
						if (model.isDeleted == false) {
							//Maintain map here and then at last compare amount of invoice and the sum of line items
							var lineItemTotalAmount = parseFloat(criteriaSum[field.childSObjectField.name + '-' + findex]) + parseFloat(model[field.childSObjectField.name] ? model[field.childSObjectField.name] : 0);
							criteriaSum[field.childSObjectField.name + '-' + findex] = lineItemTotalAmount;
						}	
					});
				});
				angular.forEach($scope.section.componentConfig.sectionComponentAmtFields, function (field, findex) {
					var headerAmt = $scope.$parent.$parent.$parent.model[field.parentSObjectField.name];
					if (headerAmt === undefined || headerAmt === null || headerAmt === "") {
						headerAmt = 0;
					}
					if (criteriaSum[field.childSObjectField.name + '-' + findex] !== undefined && criteriaSum[field.childSObjectField.name + '-' + findex] != headerAmt) {
						errorMessages[$scope.section.title + "-" + field.childSObjectField.name + "-" + field.childSObjectField.label] =  $scope.section.title+ " total of " + field.childSObjectField.label +" field must be " + headerAmt;
						//errorMessages[$scope.section.title + "-" + field.childSObjectField.name + "-" + field.childSObjectField.label] = "Total amount (" + criteriaSum[field.childSObjectField.name + '-' + findex] + ") of " + $scope.section.title + "-" + field.childSObjectField.label + " field must be " + headerAmt;
						fieldRequire = true;
					}
				});

			}
			if(!fieldRequire)
				return "";
			else{
				var errorMessagesStr = "";
				angular.forEach(errorMessages, function(error,key) {
					errorMessagesStr += error + "</br>";
				});
				// errorMessagesStr += "</ul>";
				// $dialog.alert(errorMessagesStr,'Error','pficon pficon-error-circle-o');
				return errorMessagesStr;
			}
		};

		$scope.ctrl["LineItemComponentValidate"+$scope.section.id]= function(callback){
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
		}
		$scope.ctrl["LineItemComponentSave"+$scope.section.id]= function(callback){
			$scope.save();
		}
		$scope.save = function(){
			if($scope.isComponentValid()){
				componentBlock.start('Saving invoice line items...');
				var dataModelLst=[];
				angular.forEach($scope.dataModelList,function(model){
					var datamodel={};
					if(model['attributes']!=undefined){
						datamodel['attributes']=model['attributes'];
					}
					datamodel['isPersisted']=model['isPersisted'];
					datamodel['isDeleted']=model['isDeleted'];
					datamodel['isRemovable']=model['isRemovable'];
					angular.forEach($scope.invoiceData.fields,function(sObject){
						datamodel[sObject.SObjectField.name]=model[sObject.SObjectField.name];
					});
					dataModelLst.push(datamodel);
				});
				var dataObject = {
					sObject: $scope.section.Component.ComponentDetails[0].configuration.detailSObjectName,
					dataModelList: dataModelLst,
					parentID:$scope.ctrl.dataModel.Id,
					lookupFieldName:$scope.invoiceData.componentConfig.ComponentDetails[0].configuration.connectingField,
				};
				$http.post("/api/service/component/savelineitemdata", dataObject)
					.success(function(response){
						if(!response.success){
							$dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
						}
						componentBlock.stop();
						$scope.init();
					})
					.error(function(){
						componentBlock.stop();
						$dialog.alert('Server error occured while loading details.','Error','pficon pficon-error-circle-o');
					});
			}
			else{

				return false;
			}
		};
		$scope.init = function(){
			$scope.loadLineItems();
		};
		$scope.init();
	}
]);