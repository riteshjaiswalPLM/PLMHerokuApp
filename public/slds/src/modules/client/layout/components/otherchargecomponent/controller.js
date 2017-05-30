'use strict';

client.controller('OtherChargeComponentController',[
			'$scope','$log','$http','$rootScope','blockUI','$stateParams','ModalService','$filter','$dialog','$appCache',
	function($scope , $log , $http , $rootScope , blockUI , $stateParams , ModalService , $filter , $dialog,$appCache){
// 		    var errorMessages = [];
		var currencyFilter = $filter('currencyFilter');
		var componentBlock = blockUI.instances.get("OtherChargeComponentBlock");
		$scope.loadInvoiceLineItems = function(){
			componentBlock.start('Loading invoice line items...');

			$scope.amountFieldName=$appCache.get('OtherChargeComponent_'+$scope.section.Component.parent+'_amountFieldName');
			$scope.childAmountFieldName=$appCache.get('OtherChargeComponent_'+$scope.section.Component.child+'_childAmountFieldName');
			$scope.othercharageFieldName=$appCache.get('OtherChargeComponent_'+$scope.section.Component.child+'_othercharageFieldName');
			$scope.invoicelookupFieldName=$appCache.get('OtherChargeComponent_'+$scope.section.Component.child+'_invoicelookupFieldName');
			
			if($scope.amountFieldName === undefined || $scope.amountFieldName === null
				|| $scope.childAmountFieldName === undefined || $scope.childAmountFieldName === null)
			{
				$http.post("/api/service/component/getSobjectFields",$scope.section.Component.parent)
				.success(function(response){
					if(response.success === true){
						$scope.parentsObjectFields = response.data.sObjectFields;
						$http.post("/api/service/component/getSobjectFields",$scope.section.Component.child)
						.success(function(response){
							if(response.success === true){
								$scope.childObjectFields = response.data.sObjectFields;
								// get parent field name Dynamic
								$scope.amountFieldName='';

								$scope.parentsObjectFields.forEach(function(field){
									if(field.name.indexOf('Other_Charges_Surcharges__c') != -1){
										$scope.amountFieldName=field.name;
									}
								});

								$appCache.put('OtherChargeComponent_'+$scope.section.Component.parent+'_amountFieldName', $scope.amountFieldName);
							
								// get child field name dynamic
								$scope.childAmountFieldName='';
								$scope.othercharageFieldName='';
								$scope.invoicelookupFieldName='';	

								$scope.childObjectFields.forEach(function(field){
									if(field.name.indexOf('Amount__c') != -1 && field.label==='Amount'){
										$scope.childAmountFieldName=field.name;
									}
									if(field.name.indexOf('Is_Other_Charge__c') != -1){
										$scope.othercharageFieldName=field.name;
									}
									if(field.name.indexOf('Invoice__c') != -1){
										$scope.invoicelookupFieldName=field.name;
									}
								});
								
								$appCache.put('OtherChargeComponent_'+$scope.section.Component.child+'_childAmountFieldName', $scope.childAmountFieldName);
								$appCache.put('OtherChargeComponent_'+$scope.section.Component.child+'_othercharageFieldName', $scope.othercharageFieldName);
								$appCache.put('OtherChargeComponent_'+$scope.section.Component.child+'_invoicelookupFieldName', $scope.invoicelookupFieldName);

								$scope.invoiceData = {};
								$scope.invoiceData = {
										invoiceId :$scope.ctrl.stateParamData.record.Id,
										componentConfig :$scope.section.Component,
										amountFieldName:$scope.amountFieldName,
										othercharageFieldName:$scope.othercharageFieldName,
										invoicelookupFieldName:$scope.invoicelookupFieldName,
										isOtherCharage:true,
										childAmountFieldName:$scope.childAmountFieldName
								};

								
								$scope.invoiceAmount = 0.0;
								$http.post("/api/service/component/getinvoicelineitemdata",$scope.invoiceData)
									.success(function(response){
										if(response.success){
											angular.forEach(response.data.dataModelList, function(model, key){
												response.data.dataModelList[key].isRemovable = true;
												response.data.dataModelList[key].isPersisted = true;
												response.data.dataModelList[key].isDeleted = false;
											});
											$scope.dataModelList = response.data.dataModelList;
											if(response.data.invoiceAmount && response.data.invoiceAmount!=null )
											{
												$scope.invoiceAmount=isNaN(response.data.invoiceAmount) ? 0 : parseFloat(parseFloat(response.data.invoiceAmount).toFixed(3));
											}
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
									
							}
							else{
								$dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
								return;
							}
						}).error(function(response){
							$dialog.alert('Server Error occured while loading component details.','Error','pficon pficon-error-circle-o');
							componentBlock.stop();
						});
						
					}else{
						$dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
						componentBlock.stop();
						return;
					}
				})
				.error(function(response){
					$dialog.alert('Server Error occured while loading component details.','Error','pficon pficon-error-circle-o');
					componentBlock.stop();
				});
			}
			else{
				$scope.invoiceData = {};
				$scope.invoiceData = {
						invoiceId :$scope.ctrl.stateParamData.record.Id,
						componentConfig :$scope.section.Component,
						amountFieldName:$scope.amountFieldName,
						othercharageFieldName:$scope.othercharageFieldName,
						invoicelookupFieldName:$scope.invoicelookupFieldName,
						isOtherCharage:true,
						childAmountFieldName:$scope.childAmountFieldName
				};

				
				$scope.invoiceAmount = 0.0;
				$http.post("/api/service/component/getinvoicelineitemdata",$scope.invoiceData)
					.success(function(response){
						if(response.success){
							angular.forEach(response.data.dataModelList, function(model, key){
								response.data.dataModelList[key].isRemovable = true;
								response.data.dataModelList[key].isPersisted = true;
								response.data.dataModelList[key].isDeleted = false;
							});
							$scope.dataModelList = response.data.dataModelList;
							if(response.data.invoiceAmount && response.data.invoiceAmount!=null )
							{
								$scope.invoiceAmount=isNaN(response.data.invoiceAmount) ? 0 : parseFloat(parseFloat(response.data.invoiceAmount).toFixed(3));
							}
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
			}
		};
		$scope.getTotal = function(){			// getTotal()
			var invoiceLineItemTotalAmount 	= 0;
			angular.forEach($scope.dataModelList , function(model) {
				if(!model.isDeleted)
					//invoiceLineItemTotalAmount += parseFloat(model['Amount__c']);
					invoiceLineItemTotalAmount += parseFloat(model[$scope.childAmountFieldName]);
			});
			return isNaN(invoiceLineItemTotalAmount) ? 0 : invoiceLineItemTotalAmount;
		};
		$scope.addItems = function(){	// addItem()
			if($scope.getTotal() <  $scope.invoiceAmount){

				$scope.newfields={};
				$scope.invoiceData.componentConfig.fields.forEach(function(field){
					if(!$scope.newfields[field.SObjectField.name]){
						$scope.newfields[field.SObjectField.name]=null;
						if(field.SObjectField.type === 'reference'){
							if(field.SObjectField.reference === undefined){
								$scope.newfields[field.SObjectField.relationshipName]={'Name':null};
							}else{
								var refField=field.SObjectField.reference;
								$scope.newfields[field.SObjectField.relationshipName]={refField	 :null};
							}
						}
					}
				});

				if($scope.newfields[$scope.childAmountFieldName] === undefined)
				{
					$dialog.alert("You are not allowed to add more without amount column  ",'Error','pficon pficon-error-circle-o');
					return false;
				}
				$scope.newfields[$scope.childAmountFieldName] = $scope.invoiceAmount - $scope.getTotal();
				//$scope.newfields['Amount__c'] = $scope.invoiceAmount - $scope.getTotal();
				$scope.newfields["isRemovable"] = true;
				$scope.newfields["isPersisted"] = false;
				$scope.newfields["isDeleted"] = false;
				$scope.dataModelList.push($scope.newfields);
			}
		  	else{
				$dialog.alert("You are not allowed to add more with total amount more than  " + ($scope.invoiceAmount),'Validation Alert','pficon-warning-triangle-o');	
				return false;
		  	}
		};
		$scope.isValid = function () {
		var errorMessages = {};
			var fieldRequire=false;
			angular.forEach($scope.dataModelList,function(model){
				if(model.isDeleted == false){
					angular.forEach($scope.section.Component.fields,function(sObject){
						if(sObject.rendered && sObject.required && (model[sObject.SObjectField.name] == null || model[sObject.SObjectField.name] == '' )){
							errorMessages[sObject.label]=sObject.label +" must be required.";
							fieldRequire=true;
						}
						if(sObject.rendered===false){
							delete model[sObject.SObjectField.name];
							if(sObject.SObjectField.type === 'reference'){
								delete model[sObject.SObjectField.relationshipName];
							}
						}
					});
				}
				
			});
			if(!fieldRequire && ( $scope.getTotal() !=  $scope.invoiceAmount)){
				errorMessages[$scope.section.title]=$scope.section.title+" total amount must be " + ($scope.invoiceAmount);
				fieldRequire=true;
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

		$scope.ctrl.OtherChargeComponentValidate= function(callback){
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
		$scope.ctrl.OtherChargeComponentSave= function(){
			$scope.save();
		}
		$scope.save = function(){
			if($scope.isComponentValid()){
				componentBlock.start('Saving invoice line items...');
				var dataObject = {
					sObject: $scope.section.Component.child.name,
					dataModelList: $scope.dataModelList,
					InvID:$scope.ctrl.dataModel.Id,
					invoicelookupFieldName:$scope.invoicelookupFieldName,
					othercharageFieldName:$scope.othercharageFieldName,
					isOtherCharage:true
				};
				$http.post("/api/service/component/saveinvoicelineitemdata", dataObject)
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
			$scope.loadInvoiceLineItems();
		};
		$scope.init();
	}
]);