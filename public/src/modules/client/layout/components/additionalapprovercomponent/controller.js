'use strict';

client.controller('AdditionalApproverComponentController',[
			'$scope','$log','$http','$rootScope','blockUI','$stateParams','ModalService','$filter','$dialog',
	function($scope , $log , $http , $rootScope , blockUI , $stateParams , ModalService , $filter , $dialog){
// 		    var errorMessages = [];
		var currencyFilter = $filter('currencyFilter');
		var componentBlock = blockUI.instances.get("CostAllocationComponentBlock");
		$scope.loadInvoiceLineItems = function(){
			componentBlock.start('Loading invoice line items...');
			$scope.invoiceData = {};
			$scope.invoiceData = {
                invoiceId :$scope.ctrl.stateParamData.record.Id,
                componentConfig :$scope.section.Component
			};
            $scope.invoiceAmount = 0.0;
			$http.post("/api/service/component/invoicelineitems",$scope.invoiceData)
				.success(function(response){
					if(response.success){
						angular.forEach(response.data.dataModelList, function(model, key){
							response.data.dataModelList[key].isRemovable = true;
							response.data.dataModelList[key].isPersisted = true;
							response.data.dataModelList[key].isDeleted = false;
						});
						$scope.dataModelList = response.data.dataModelList;
						if(response.data.invoiceAmount)
						{
							  $scope.invoiceAmount = parseFloat(parseFloat(response.data.invoiceAmount).toFixed(3));
						}
						// if($scope.getTotal() <  $scope.invoiceAmount){
						// 	$scope.addItems();
						// }
					}else{
						$dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
					}
					componentBlock.stop();
				})
				.error(function(){
					componentBlock.stop();
					$dialog.alert('Server error occured while loading details.','Error','pficon pficon-error-circle-o');
				});
		};
		$scope.getTotal = function(){			// getTotal()
			var invoiceLineItemTotalAmount 	= 0;
			angular.forEach($scope.dataModelList , function(model) {
				if(!model.isDeleted)
					invoiceLineItemTotalAmount += parseFloat(model['Amount__c']);
			});
			return isNaN(invoiceLineItemTotalAmount) ? 0 : (isNaN(currencyFilter(invoiceLineItemTotalAmount)) ? 0 : currencyFilter(invoiceLineItemTotalAmount));
		};
		$scope.addItems = function(){	// addItem()
			if($scope.getTotal() <  $scope.invoiceAmount){
				$scope.newfields = angular.copy($scope.dataModelList[0]);		
				angular.forEach($scope.newfields,function(field, key){
					$scope.newfields[key] = null;
				});
				$scope.newfields['Amount__c'] = $scope.invoiceAmount - $scope.getTotal();
				$scope.newfields["isRemovable"] = true;
				$scope.newfields["isPersisted"] = false;
				$scope.newfields["isDeleted"] = false;
				$scope.dataModelList.push($scope.newfields);
			}
		  	else{
				$dialog.alert("You are not allowed to add more cost allocation with total amout more than  " + currencyFilter($scope.invoiceAmount),'Error','pficon pficon-error-circle-o');	
				return false;
		  	}
		};
		$scope.isValid = function () {
			var errorMessages = [];
			if($scope.getTotal() <= 0 || $scope.getTotal() !=  $scope.invoiceAmount){
				errorMessages.push("Cost allocation total amount must be " + currencyFilter($scope.invoiceAmount));
			}
			angular.forEach($scope.dataModelList,function(model){
				angular.forEach($scope.section.Component.fields,function(sObject){
					if(sObject.required && (model[sObject.name] == null || model[sObject.name] == '' )){
						errorMessages.push("Please provide " + sObject.label );
					}
				});
			});
			
			if(errorMessages.length == 0)
				return true;
			else
			    return false;
		};
		$scope.isComponentValid = function(){
			return $scope.isValid();
		}
		$scope.save = function(){
			if($scope.isValid()){
				componentBlock.start('Loading invoice line items...');
				var dataObject = {
					sObject: $scope.section.Component.child.name,
					dataModelList: $scope.dataModelList
				};
				$http.post("/api/service/component/savecostallocationdata", dataObject)
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
				var errorMessagesStr = "<ul>";
				angular.forEach(errorMessages, function(error) {
					errorMessagesStr += "<li>" + error + "</li>";
				});
				errorMessagesStr += "</ul>";
				$dialog.alert(errorMessagesStr,'Error','pficon pficon-error-circle-o');
				return false;
			}
		};
		$scope.init = function(){
			$scope.loadInvoiceLineItems();
		};
		$scope.init();
	}
]);

App.service('AdditionalApproverPOCService',[
            '$http','Notification','$filter','blockUI',
    function($http , Notification , $filter , blockUI){
    
    var numberFilter = $filter('number');

    var SupplierPOCService = function(supplier,approverUsers){
        this.supplier = supplier;
        this.approverUsers = [];
        var self = this;
        angular.forEach(approverUsers,function(user){
            self.approverUsers.push(self.getFilledApprovalDetails(user));
        });
    };

    /*
    * PROTOTYPE METHODS (Service methods)
    */
    SupplierPOCService.prototype.getFilledApprovalDetails = function(user){		// getFilledApprovalDetails()
        var approverDetailsObject = {
            akritivesm__Action_Date__c			: user.allFields.akritivesm__Action_Date__c,
            akritivesm__Approval_Cycle__c		: user.allFields.akritivesm__Approval_Cycle__c,
            akritivesm__Approval_Status__c		: user.allFields.akritivesm__Approval_Status__c,
            akritivesm__Approver_User__c		: {
                                                    id		:user.allFields.akritivesm__Approver_User__c,
                                                    name	:user.relationshipSubObjects.akritivesm__Approver_User__r.allFields.Name
                                                    },
            akritivesm__Comments__c				: user.allFields.akritivesm__Comments__c,
            akritivesm__Record_Type__c			: user.allFields.akritivesm__Record_Type__c,
            akritivesm__Reject_Reason__c		: user.allFields.akritivesm__Reject_Reason__c,
            isPersisted							: true,
            isRecalled							: false,
            isRecallable						: (user.allFields.akritivesm__Approval_Status__c == 'Pending'),
            id                                  : user.id
        }
        if(this.sObject.name === 'Invoice__c'){
            approverDetailsObject['Is_Final_Approvar__c'] = user.allFields.Is_Final_Approvar__c;
            approverDetailsObject['akritivesm__Invoice_Id__c'] = user.allFields.akritivesm__Invoice_Id__c;
            approverDetailsObject['isFinalApproverRecalled'] = false;
        }
        else{
            approverDetailsObject['VM_Current_State__c'] = user.allFields.VM_Current_State__c;
        }
    };

    SupplierPOCService.prototype.getNewlyAddedApproverUsers = function(){		// getNewlyAddedApproverUsers()
        var newApproverUsers = [];
        angular.forEach(this.approverUsers,function(user){
            if(!user.isPersisted){
                newApproverUsers.push(user);
            };
        });
        return newApproverUsers;
    };

    SupplierPOCService.prototype.getStatusBadge = function(status){				// getStatusBadge()
        var statusBadge = "";
        switch(status){
            case "Pending": statusBadge = "<span class='badge'>Pending</span>"; break;
            case "Reject": statusBadge = "<span class='badge badge-error'>Rejected</span>"; break;
            case "Approve": statusBadge = "<span class='badge badge-success'>Approved</span>"; break;
        }
        return statusBadge;
    };

    SupplierPOCService.prototype.executeAction = function(index,user,errors){					// executeAction()
        var self = this;
        var actionName = this.getActionButtonName(user);
        if(user.isPersisted){
            var supplierMaintenanceDetailsBlock = blockUI.instances.get('supplierMaintenanceDetailsBlock');

            switch(actionName){
                // RESEND SUPPLIER FOR APPROVAL
                case "Resend":
                                supplierMaintenanceDetailsBlock.start("Resending supplier maintenance for approval...");
                                $http.post("rest/supplier-maintenance/resendforapproval", user)
                                    .success(function(response){
                                        if(response.status === "SUCCESS"){
                                            self.approverUsers.splice(index,1);
                                            self.approverUsers.push(self.getFilledApprovalDetails(response.data.approverUser));
                                            var approversResponseRecieved = true;
                                            angular.forEach(self.approverUsers,function(user){
                                                if(approversResponseRecieved){
                                                    if(user.akritivesm__Approval_Status__c == 'Pending'){
                                                        approversResponseRecieved = false;
                                                    }
                                                }
                                            });
                                            if(self.approverUsers.length == 0){
                                                self.supplier.allFields.Approval_Status__c = null;
                                            }
                                            else if (approversResponseRecieved){
                                                self.supplier.allFields.Approval_Status__c = 'Response Received';
                                            }
                                            else{
                                                self.supplier.allFields.Approval_Status__c = 'Sent For Approval';
                                            }
                                            Notification.success({
                                                message	:'Supplier resent for approval.',
                                                title	:'Success'
                                            });
                                        }
                                        else{
                                            Notification.error({
                                                message	:'Error occured while resending supplier for approval!!',
                                                title	:'Error!'
                                            });
                                            errors = response.errors;
                                        }
                                        supplierMaintenanceDetailsBlock.stop();
                                    })
                                .error(function(response){
                                // ERROR STUFF
                                    Notification.error({
                                        message	:'Unexpected error occured while resending supplier for approval!!',
                                        title	:'Error!'
                                    });
                                    supplierMaintenanceDetailsBlock.stop();
                                });
                                break;
                case "Recall":
                                supplierMaintenanceDetailsBlock.start("Recalling supplier maintenance from approval...");
                                $http.post("rest/supplier-maintenance/recallfromapproval", user)
                                    .success(function(response){
                                        if(response.status === "SUCCESS"){
                                            self.approverUsers.splice(index,1);
                                            var approversResponseRecieved = true;
                                            angular.forEach(self.approverUsers,function(user){
                                                if(approversResponseRecieved){
                                                    if(user.akritivesm__Approval_Status__c == 'Pending'){
                                                        approversResponseRecieved = false;
                                                    }
                                                }
                                            });
                                            if(self.approverUsers.length == 0){
                                                self.supplier.allFields.Approval_Status__c = null;
                                            }
                                            else if (approversResponseRecieved){
                                                self.supplier.allFields.Approval_Status__c = 'Response Received';
                                            }
                                            else{
                                                self.supplier.allFields.Approval_Status__c = 'Sent For Approval';
                                            }
                                            Notification.success({
                                                message	:'Supplier recalled from approval.',
                                                title	:'Success'
                                            });
                                        }
                                        else{
                                            Notification.error({
                                                message	:'Error occured while recalling supplier from approval!!',
                                                title	:'Error!'
                                            });
                                            errors = response.errors;
                                        }
                                        supplierMaintenanceDetailsBlock.stop();
                                    })
                                    .error(function(response){
                                        Notification.error({
                                            message	:'Unexpected error occured while recalling supplier from approval!!',
                                            title	:'Error!'
                                        });
                                        supplierMaintenanceDetailsBlock.stop();
                                    });
                                    break;
                default		: supplierMaintenanceDetailsBlock.stop();break;
            }
        }
    };

    SupplierPOCService.prototype.showActionButtonFor = function(user){			// showActionButtonFor()
        if(user.akritivesm__Approval_Status__c === "Approve")
            return true;
        else
            return false;
    };

    SupplierPOCService.prototype.getActionButtonName = function(user){			// getActionButtonName()
        var actionName = "";
        switch(user.akritivesm__Approval_Status__c){
            case "Approve"	: 
            case "Pending"	: actionName = "Recall"; break;
            case "Reject"	: actionName = "Resend"; break;
        }
        return actionName;
    };

    SupplierPOCService.prototype.addApproverUser = function(maxApprover){					// addApproverUser()
        var self = this;
        var count = 0;
        angular.forEach(self.approverUsers,function(user){
            if(!user.isRecalled)
                count++;
            });
            if(count > maxApprover){
                Notification.warning({
                    title	: "Warning!",
                    message	: "User can add maximum "+(maxApprover + 1)+" Approvers!!"
                });
                return;
            }

        var approverUserObject = {
            akritivesm__Action_Date__c			: null,
            akritivesm__Approval_Cycle__c		: self.supplier != null && self.supplier.allFields != null && self.supplier.allFields.akritivesm__Current_Cycle__c != null ? self.supplier.allFields.akritivesm__Current_Cycle__c : null,
            akritivesm__Approval_Status__c		: "Pending",
            akritivesm__Approver_User__c		: null,
            akritivesm__Comments__c				: null,
            akritivesm__Record_Type__c			: "Current",
            akritivesm__Reject_Reason__c		: null,
            isPersisted							: false,
            isRecalled							: false,
            isRecallable						: false,
            id                                  : null
        }
        if(this.sObject.name === 'Invoice__c'){
            approverUserObject['Is_Final_Approvar__c'] = false;
            approverUserObject['akritivesm__Invoice_Id__c'] = self.invoice.id.idStr;
            approverUserObject['isFinalApproverRecalled'] = false;
        }
        else{
            approverUserObject['VM_Current_State__c'] = null;
        }

        self.approverUsers.push(approverUserObject);
    };

    SupplierPOCService.prototype.removeApproverUser = function(index){			// removeApproverUser()
        this.approverUsers.splice(index, 1);
    }

    SupplierPOCService.prototype.getSelectedApproverUsers = function(){			// getSelectedApproverUsers()
        var self = this;
        var selectedIds = [];
        angular.forEach(self.approverUsers,function(user){
            if(user.akritivesm__Approver_User__c && user.akritivesm__Approver_User__c.id && user.akritivesm__Approval_Status__c != 'Approve')
                selectedIds.push(user.akritivesm__Approver_User__c.id);
        });
        return selectedIds;
    }

    return SupplierPOCService;
}]);