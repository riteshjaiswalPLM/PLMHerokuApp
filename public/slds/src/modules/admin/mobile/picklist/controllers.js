'use strict';
admin.controller('AdminMobilePicklistController', ['$scope', '$rootScope', '$state', function ($scope, $rootScope, $state) {
    $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams, options) {
        if (toState.name === 'admin.mobile.picklist' && fromState !== 'admin.mobile.picklist.list') {
            event.preventDefault();
            $state.go('admin.mobile.picklist.list');
        }
    });
    $scope.init = function () {
        console.log('AdminMobilePicklistController loaded!');
        $state.go('admin.mobile.picklist.list');
    };
    $scope.init();
}]);

admin.controller('AdminMobilePicklistListController', [
    '$scope', '$state', 'mobilePicklistService', 'blockUI', '$dialog', '$filter',
    function ($scope, $state, mobilePicklistService, blockUI, $dialog, $filter) {

        $scope.loadSObjects = function () {
            if (!$scope.blockUI.loadSObjects.state().blocking) {
                $scope.blockUI.loadSObjects.start('Loading local sobjects...');
                mobilePicklistService.loadSObjects({ includeFields: true })
                    .success(function (response) {
                        if (response.success) {
                            $scope.sObjects = $filter('filter')(response.data.sObjects, { forMobile: true });
                            $scope.sObjectUserType=[];
                            angular.forEach($scope.sObjects, function (sobject) {
                                if(sobject.name.indexOf("Buyer_Users__c") !== -1){
                                    $scope.sObjectUserType = $filter('filter')(sobject.SObjectFields, { type: 'picklist'});
                                }
                            });
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.loadSObjects.stop();
                    })
                    .error(function (response) {
                        $dialog.alert('Error occured while loading local sobjects.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.loadSObjects.stop();
                    });
            }
        };

        $scope.loadPicklistDetail = function () {
            if (!$scope.blockUI.picklist.state().blocking) {
                $scope.blockUI.picklist.start('Loading Picklist Detail...');
                mobilePicklistService.loadPicklistDetail({})
                    .success(function (response) {
                        if (response.success) {
                            $scope.picklistDetail = response.data.picklistDetail;
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.picklist.stop();
                    })
                    .error(function (response) {
                        $dialog.alert('Error occured while loading local sobjects.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.picklist.stop();
                    });
            }
        }

        $scope.manageChildFieldValue = function (picklistDetail) {
            $state.go('admin.mobile.picklist.managechildfieldsvalue', { picklistDetail: picklistDetail });
        }
        $scope.deletePicklistDetail = function (picklistDetail) {
            $dialog.confirm({
                title: 'Confirm delete ?',
                yes: 'Yes, Delete', no: 'Cancel',
                message: 'All information related to ' + picklistDetail.parentfieldvalue + ' of ' + picklistDetail.SObject.label + ' will be deleted. \nAre you sure ?',
                class: 'danger'
            }, function (confirm) {
                if (confirm) {
                    if (!$scope.blockUI.picklist.state().blocking) {
                        $scope.blockUI.picklist.start('Deleting Picklist Detail...');
                        mobilePicklistService.deletePicklistDetail({ id: picklistDetail.id })
                            .success(function (response) {
                                if (response.success) {
                                    $dialog.alert("Picklist Detail Deleted successfully", '', '');
                                } else {
                                    $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                                }
                                $scope.blockUI.picklist.stop();
                                $scope.loadPicklistDetail();
                            })
                            .error(function (response) {
                                $dialog.alert('Error occured while deleting User Action.', 'Error', 'pficon pficon-error-circle-o');
                                $scope.blockUI.picklist.stop();
                            });
                    }
                }
            });

        }

        $scope.onSobjectChange = function (sObject) {
            if (sObject != null) {
                $scope.sObjectFields = []
                var pname=[];
                var SobjectFielddata=$filter('filter')(sObject.SObjectFields, { type: 'picklist',forMobile: true, dependentPicklist: true  });
                angular.forEach(SobjectFielddata, function (field) {
                    if(pname.indexOf(field.controllerName) === -1)
                        pname.push(field.controllerName);
                });
                angular.forEach(sObject.SObjectFields, function (field) {
                    if(pname.indexOf(field.name) !== -1)
                        $scope.sObjectFields.push(field)
                });
                
            }
            else {
                $scope.sObjectFields = [];
            }
        }
        $scope.onSobjectParentFieldChange = function (sObject,sObjectFields) {
            if (sObject != null) {
                $scope.sObjectChildFields = $filter('filter')(sObject.SObjectFields, { forMobile: true,controllerName :sObjectFields.name   });
            }
            else {
                $scope.sObjectChildFields = [];
            }
            if (sObjectFields != null) {
                $scope.sObjectFieldsValue = sObjectFields.picklistValues;
            }
            else {
                $scope.sObjectFieldsValue = [];
            }
        }
        
        $scope.addItem = function () {
            if ($scope.data.SObject == undefined || $scope.data.SObject == null || $scope.data.SObject == "") {
                $dialog.alert("Please Select Sobject", 'Error', 'pficon pficon-error-circle-o');
            }
            else if ($scope.data.SObjectField == undefined || $scope.data.SObjectField == null || $scope.data.SObjectField == "") {
                $dialog.alert("Please Select Parent Sobject Field", 'Error', 'pficon pficon-error-circle-o');
            }
            else if ($scope.data.sObjectChildFields == undefined || $scope.data.sObjectChildFields == null || $scope.data.sObjectChildFields == "") {
                $dialog.alert("Please Select Child Sobject Field", 'Error', 'pficon pficon-error-circle-o');
            }
            else if ($scope.data.sObjectUserType == undefined || $scope.data.sObjectUserType == null || $scope.data.sObjectUserType == "") {
                $dialog.alert("Please Select User Type Field of Buyer User Object.", 'Error', 'pficon pficon-error-circle-o');
            }
            else if ($scope.data.SObjectFieldValue == undefined || $scope.data.SObjectFieldValue == null || $scope.data.SObjectFieldValue == "") {
                $dialog.alert("Please Select Parent Value", 'Error', 'pficon pficon-error-circle-o');
            }
            else {
                if($scope.isItemExist()){
                     $dialog.alert('Picklist Detail already configured.', 'Error', 'pficon pficon-error-circle-o');
                }
                else{
                    if (!$scope.blockUI.picklist.state().blocking) {
                        $scope.blockUI.picklist.start('Saving Picklist Detail...');
                        var finalData={ 
                            parentfieldvalue        : $scope.data.SObjectFieldValue, 
                            SObjectId               : $scope.data.SObject.id,
                            parentSObjectFieldId    : $scope.data.SObjectField.id,
                            childSObjectFieldId     : $scope.data.sObjectChildFields.id,
                            userTypeSObjectFieldId  : $scope.data.sObjectUserType.id
                        }
                        mobilePicklistService.savePicklistDetail(finalData)
                            .success(function (response) {
                                if (response.success) {
                                    $scope.data.SObjectFieldValue="";
                                    $dialog.alert("Picklist Detail Added successfully", '', '');
                                } else {
                                    $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                                }
                                $scope.blockUI.picklist.stop();
                                $scope.loadPicklistDetail();
                            })
                            .error(function (response) {
                                $dialog.alert('Error occured while adding User Action.', 'Error', 'pficon pficon-error-circle-o');
                                $scope.blockUI.picklist.stop();
                            });
                    }
                }

            }
        }
        $scope.isItemExist = function(){
            var isExist=false;
            angular.forEach($scope.picklistDetail, function (detail) {
                if($scope.data.SObject.id === detail.SObject.id && $scope.data.SObjectField.id === detail.parentSObjectField.id 
                        && $scope.data.sObjectChildFields.id === detail.childSObjectField.id 
                        && $scope.data.SObjectFieldValue === detail.parentfieldvalue){
                    isExist=true;
                }
            });
            return isExist;
        }

        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                loadSObjects: blockUI.instances.get('loadSObjects'),
                picklist: blockUI.instances.get('Picklist')
            };
        };
        $scope.init = function () {
            $scope.data = {};
            $scope.sObjectFields = [];
            $scope.sObjectChildFields = [];
            $scope.sObjectUserType =[];
            $scope.sObjectFieldsValue = [];
            console.log('AdminMobilePicklistListController loaded!');
            $scope.initBlockUiBlocks();
            $scope.loadSObjects();
            $scope.loadPicklistDetail();
        };
        $scope.init();
    }]);

admin.controller('AdminMobilePicklistFieldController', [
    '$scope', '$state', '$stateParams', '$controller', '$adminModals','mobilePicklistService', 'sobjectService', 'blockUI', '$dialog', '$timeout', '$adminLookups', 'genericComponentService', 'staticComponentService', '$filter',
    function ($scope, $state, $stateParams, $controller, $adminModals,mobilePicklistService, sobjectService, blockUI, $dialog, $timeout, $adminLookups, genericComponentService, staticComponentService, $filter) {
        var thisCtrl = this;
        $scope.loadSObjectFields = function () {
            if (!$scope.blockUI.picklist.state().blocking && $scope.layout.SObject != null) {
                $scope.blockUI.picklist.start('Loading Fields...');
                sobjectService.loadSObjectFields($scope.layout.SObject)
                    .success(function (response) {
                        if (response.success) {
                            $scope.layout.SObject.fields = []; // = response.data.sObjectFields;
                            // $scope.refSObjects = response.data.refSObjects;
                            $scope.dataSObjectFields = response.data.sObjectFields = $filter('filter')(response.data.sObjectFields, { forMobile: true });
                            mobilePicklistService.loadUserActionFields($scope.layout)
                                .success(function (response) {
                                    if (response.success) {

                                        angular.forEach(response.data.userActionFields, function (userfield) {
                                            angular.forEach($scope.dataSObjectFields, function (field) {
                                                if (userfield.SObjectFieldId == field.id) {
                                                    field.readonly = userfield.type == "Readonly";
                                                    field.required = userfield.type == "Required";
                                                    field.optional = userfield.type == "Optional";
                                                }
                                            });
                                        });

                                        angular.forEach($scope.dataSObjectFields, function (field) {
                                            var SObjectLayoutField = {
                                                SObjectField: field,
                                                label: field.label,
                                                readonly: field.readonly === undefined?false:field.readonly,
                                                required: field.required === undefined?false:field.required,
                                                optional: field.optional === undefined?false:field.optional,
                                            };

                                            $scope.layout.SObject.fields.push(SObjectLayoutField);
                                        });
                                    } else {
                                        $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                                    }
                                    $scope.blockUI.picklist.stop();
                                })
                                .error(function (response) {
                                    $dialog.alert('Error occured while loading sobject fields.', 'Error', 'pficon pficon-error-circle-o');
                                    $scope.blockUI.picklist.stop();
                                });
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                            $scope.blockUI.picklist.stop();
                        }
                        
                    })
                    .error(function (response) {
                        $dialog.alert('Error occured while loading sobject fields.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.picklist.stop();
                    });
            }
        };
        $scope.loadPicklistChildDetail = function(){
            mobilePicklistService.loadPicklistChildDetail({id:$scope.layout.id})
                .success(function (response) {
                    if (response.success) {

                        $scope.picklistChildDetail=[];
                        $scope.picklistDetail={
                            sobject : response.data.dependentPicklistDetail[0].SObject.label,
                            sobjectParentField : response.data.dependentPicklistDetail[0].parentSObjectField.label,
                            sobjectParentValue : response.data.dependentPicklistDetail[0].parentfieldvalue,
                            sobjectChildField  : {
                                            "label" :response.data.dependentPicklistDetail[0].childSObjectField.label,
                                            "SObjectField" :{
                                                "picklistValues": response.data.dependentPicklistDetail[0].childSObjectField.picklistValues
                                            }
                                        }
                        }
                        angular.forEach(response.data.dependentPicklistDetail[0].userTypeSObjectField.picklistValues, function (usertypevalues) {
                            var dataItem={
                                userType      : usertypevalues.value
                            }
                            angular.forEach(response.data.dependentPicklistChildDetail, function (field) {
                                if(field.userType === usertypevalues.value ){
                                    dataItem["dependentValue"]=field.childfieldvalue;
                                }
                            });
                            // dataItem["dependentValue"]=["Approval Received","Create"].join();
                            $scope.picklistChildDetail.push(dataItem);
                        });
                        var dataItem={
                            userType      : 'DEFAULT'
                        }
                        angular.forEach(response.data.dependentPicklistChildDetail, function (field) {
                            if(field.userType ==='DEFAULT' ){
                                dataItem["dependentValue"]=field.childfieldvalue;
                            }
                        });
                        $scope.picklistChildDetail.push(dataItem);
                    } else {
                        $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                    }
                    $scope.blockUI.picklist.stop();
                })
                .error(function (response) {
                    $dialog.alert('Error occured while loading Picklist Detail.', 'Error', 'pficon pficon-error-circle-o');
                    $scope.blockUI.picklist.stop();
                });
        }

        $scope.returnToList = function () {
            $state.go('admin.mobile.picklist.list');
        };
        
        $scope.manageChildFieldValue = function(field){
            $scope.currentField=field;
            if(field.alreadySelectedPicklistValue === undefined){
                var alreadySelectedPicklistValue=[];
                var existData=","+field.dependentValue+",";
                angular.forEach($scope.picklistDetail.sobjectChildField.SObjectField.picklistValues, function (field) {
                    if(existData.indexOf(","+field.value+",")!=-1){
                        alreadySelectedPicklistValue.push(field);
                    }
                });
                field.alreadySelectedPicklistValue =alreadySelectedPicklistValue;
            }
            
            $scope.picklistDetail.sobjectChildField.picklistValues=field.alreadySelectedPicklistValue;
            $adminModals.layoutFieldPropertiesPicklistValues({
                field: angular.copy($scope.picklistDetail.sobjectChildField)
            }, function(field){
                $scope.currentField.alreadySelectedPicklistValue = field.picklistValues;
                var dependentValue="";
                angular.forEach(field.picklistValues, function (field) {
                    dependentValue+=field.value+",";
                });
                if(dependentValue.length>0){
                    dependentValue=dependentValue.substring(0,dependentValue.length-1);
                }
                $scope.currentField.dependentValue=dependentValue;
            });
        }
        $scope.saveChildPicklistDetail = function () {
            if (!$scope.blockUI.picklist.state().blocking && $scope.layout.SObject != null) {
                $scope.blockUI.picklist.start('Saving ...');
                var data = {
                    picklistDetail: $scope.layout,
                    picklistChildDetail: $scope.picklistChildDetail,
                }
                mobilePicklistService.saveChildPicklistDetail(data)
                    .success(function (response) {
                        $scope.blockUI.picklist.stop();
                        if (response.success === true) {
                            // $scope.loadSObjectFields();
                        } else {
                            $dialog.alert('Error occured while saving layout.', 'Error', 'pficon pficon-error-circle-o');
                        }
                    })
                    .error(function (response) {
                        $scope.blockUI.picklist.stop();
                        $dialog.alert('Server error occured while saving layout.', 'Error', 'pficon pficon-error-circle-o');
                    });
            }
        };

        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                picklist: blockUI.instances.get('picklistchildfieldvalue'),
            };
        };
        $scope.init = function () {
            console.log('AdminMobilePicklistFieldController loaded!');
            $scope.picklistChildDetail=[];
            $scope.initBlockUiBlocks();
            $scope.layout = $stateParams.picklistDetail;
            // $scope.loadSObjectFields();
            $scope.loadPicklistChildDetail();


        };
        $scope.init();
    }
]);