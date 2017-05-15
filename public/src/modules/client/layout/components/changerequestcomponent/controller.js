'use strict';

client.controller('ChangeRequestComponentController',
		[	'$scope','$log','Upload','$http','blockUI','$stateParams','ModalService','$dialog','$clientLookups',
	function($scope , $log , Upload , $http , blockUI , $stateParams , ModalService , $dialog , $clientLookups){
			
		var ChangeRequestComponentBlock = blockUI.instances.get('ChangeRequestComponentBlock');
        var sObjectData = {
			id: $scope.ctrl.stateParamMetaData.sobject.id
		}
        $scope.loadComponentDetail = function (){
			ChangeRequestComponentBlock.start('Fetching change request list.');
			if($scope.ctrl.stateParamData && $scope.ctrl.stateParamData.record && $scope.ctrl.stateParamData.record.Id)
			{
				$http.post("/api/service/component/getrecorddetail", {id:$scope.ctrl.stateParamData.record.Id,sObjectName:$scope.ctrl.stateParamMetaData.sobject.name})
	    		.success(function(response){
					ChangeRequestComponentBlock.stop();
					if(response.success){
						$scope.supplierMaintenanceDetail=[];
						$scope.supplierMaintenanceDetail = response.data.records;
						$scope.getChangeReuestList(sObjectData);
                    } 
					else {
						$dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
					}
				})
				.error(function() {
					ChangeRequestComponentBlock.stop();
					$dialog.alert('Server error occured while loading details.','Error','pficon pficon-error-circle-o');
				});

			}else{
				ChangeRequestComponentBlock.stop();
				$scope.getChangeReuestList(sObjectData);
			}
			
		};
		$scope.getChangeReuestList=function(sObjectData){
			ChangeRequestComponentBlock.start('Fetching change request list.');
			$http.post("/api/service/component/changerequestlist", sObjectData)
			.success(function(response){
				ChangeRequestComponentBlock.stop();
				if(response.success){
					$scope.changeRequestFieldsDetail = response.data.records;
					$scope.fields = response.data.fields;
					if($scope.supplierMaintenanceDetail ){
						angular.forEach($scope.changeRequestFieldsDetail, function(fields, key){
							if($scope.supplierMaintenanceDetail[fields.Current_Field__c] != $scope.supplierMaintenanceDetail[fields.Proposed_Field__c] ){
								var data={
									label				:"",
									name				:"",
									current_Field__Value:$scope.supplierProfileDetail[fields.Name],
									current_Field__c	:fields.Current_Field__c,
									proposed_Field__c	:fields.Proposed_Field__c,
									selected_val		:fields.Name,
									selected_value		:fields.Name,
									is_Required__c		:false,
									is_Selected			:false,
								};
								data[fields.Current_Field__c]=$scope.supplierMaintenanceDetail[fields.Proposed_Field__c];
								$scope.items.push(data);
							}
						});
					}
				} 
				else {
					$dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
				}
			})
			.error(function() {
				ChangeRequestComponentBlock.stop();
				$dialog.alert('Server error occured while loading details.','Error','pficon pficon-error-circle-o');
			});
		};
		$scope.validateSupplierProfileSelection = function (){
			if($scope.ctrl.dataModel[$scope.supplierProfileApiName]){
				$scope.addItem();
			}
			else{
				$dialog.alert('Please Select Supplier Profile');
			}
		};

		$scope.addItem = function (){
			$scope.items.push({
				label				:"",
				name				:"",
				current_Field__c	:"",
				proposed_Field__c	:"",
				selected_val		:"",
				is_Required__c		:false,
				is_Selected			:false
			});
		};
		$scope.ctrl.ChangeRequestComponentValidate= function(callback){
			var message="";
			var RequireFields={};
			angular.forEach($scope.changeRequestFieldsDetail, function(field){
				if(field.Is_Required__c){
					RequireFields[field.Current_Field__c]={label:field.label,required:true};
				}
				else{
					RequireFields[field.Current_Field__c]={label:field.label,required:false};
				}
			});
			if($scope.items != undefined && $scope.items.length == 0 ){
				message="Add at least one Change Request to process <br>";
			}
			angular.forEach($scope.items, function(item){
				
				if(RequireFields[item.current_Field__c]!=undefined && RequireFields[item.current_Field__c].required == true && (item[item.current_Field__c]===undefined || item[item.current_Field__c]===""))
				{
					message+=RequireFields[item.current_Field__c].label +" must be required.<br>";
				}
				else if(RequireFields[item.current_Field__c]!=undefined && ((item[item.current_Field__c]!==undefined && item[item.current_Field__c]=== item.current_Field__Value) 
				||((item[item.current_Field__c]===undefined || item[item.current_Field__c]==="") && (item.current_Field__Value==null || item.current_Field__Value===""))))
				{
					message+="Current and Proposed values of "+RequireFields[item.current_Field__c].label+" should not be identical.<br> " ;
				}
			});
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
		$scope.initSupplierProfileApiName = function(){
			angular.forEach($scope.ctrl.dataModel, function(apiName, key){
				if(key.includes("__c") && key.includes("Supplier_Profile") && !key.includes("__Name") && !key.includes("__Discription")){
					$scope.supplierProfileApiName = key;
					$scope.$watch('ctrl.dataModel.' + key,function(newVal, oldVal){
						if(newVal != oldVal && newVal){
							ChangeRequestComponentBlock.start('Fetching change request list.');
							$http.post("/api/service/component/getrecorddetail", {sObjectName:$scope.supplierProfileApiName ,id:newVal})
								.success(function(response){
									ChangeRequestComponentBlock.stop();
									if(response.success){
										$scope.supplierProfileDetail = response.data.records;
										angular.forEach($scope.items, function(item, key){
											item.current_Field__Value=$scope.supplierProfileDetail[item.selected_val];
										});
									} 
									else {
										$dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
									}
								})
								.error(function() {
									ChangeRequestComponentBlock.stop();
									$dialog.alert('Server error occured while loading details.','Error','pficon pficon-error-circle-o');
								});
						}
					});
					if($scope.ctrl.stateParamData && $scope.ctrl.stateParamData.record && $scope.ctrl.stateParamData.record.Id)
					{
						$http.post("/api/service/component/getrecorddetail", {sObjectName:$scope.supplierProfileApiName ,id:$scope.ctrl.dataModel[key]})
						.success(function(response){
							if(response.success){
								$scope.supplierProfileDetail = response.data.records;
								angular.forEach($scope.items, function(item, key){
									item.current_Field__Value=$scope.supplierProfileDetail[item.selected_val];
								});
							} 
							else {
								$dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
							}
						})
						.error(function() {
							$dialog.alert('Server error occured while loading details.','Error','pficon pficon-error-circle-o');
						});
					}
				}
				if(key.includes("__c") && key.includes("Request_Info") && !key.includes("__Name")){
					$scope.requestInfoApiName = key;
				}
			});
		};

		$scope.removeItem = function(item){
			$scope.items.splice($scope.items.indexOf(item), 1);
			$scope.removeItemData.push({
				fieldName : item
			});
		}

		$scope.$watch('items', function(newVal, oldVal) {
			if(newVal != oldVal ){
				var dataModelSobject={};
				angular.forEach($scope.removeItemData, function(rmvitem){
					dataModelSobject[rmvitem.fieldName.proposed_Field__c]=null;
					dataModelSobject[rmvitem.fieldName.current_Field__c]=null;
				});
				angular.forEach($scope.items, function(item){
					if(item.current_Field__c != "" && item[item.current_Field__c]== undefined){
						item[item.current_Field__c]="";
					}
					if(item[item.current_Field__c] != undefined)
					{
						dataModelSobject[item.current_Field__c]=item.current_Field__Value;
						dataModelSobject[item.proposed_Field__c]=item[item.current_Field__c];
					}
				});
				$scope.ctrl.dataModel['sObjectData']=dataModelSobject;
			}
		},true);
		
		$scope.changeItem = function(selected_val, item){
			var valAlrdySelected=false;
			angular.forEach($scope.items, function(items, key){
				if (selected_val!=="" && items.selected_val===selected_val )
				{
					$dialog.alert('Please select different field. <br/>Selected field already exist.');
					valAlrdySelected=true;
					item.selected_value='';
					item.current_Field__Value='';
				}
			});
			if(!valAlrdySelected)
			{
				if(item.proposed_Field__c && item.proposed_Field__c!="")
				{
					$scope.removeItemData.push({
						fieldName : angular.copy(item)
					});
				}
				item.selected_val=selected_val;	
				item.current_Field__Value=$scope.supplierProfileDetail[selected_val];
				angular.forEach($scope.changeRequestFieldsDetail, function(fieldDetail, key){
					if (fieldDetail.Name==selected_val)
					{
						item.proposed_Field__c=fieldDetail.Proposed_Field__c;
						item.current_Field__c=fieldDetail.Current_Field__c;
						return;
					}
				});
			}
			else{
				item.selected_val='';
				item.current_Field__c='';
				item.current_Field__Value='';
				item.proposed_Field__c='';
			}
		};

		$scope.initComponent = function(){
			$scope.items=[];
			$scope.removeItemData=[];
			$scope.changeRequestFieldsDetail=[];
			$scope.supplierProfileDetail=[];

			$scope.initSupplierProfileApiName();
            $scope.loadComponentDetail();

		};
		
		 $scope.initComponent();
	}
]);