'use strict';
admin.controller('AdminMobileUserActionController', ['$scope', '$rootScope', '$state', function ($scope, $rootScope, $state) {
    $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams, options) {
        if (toState.name === 'admin.mobile.useraction' && fromState !== 'admin.mobile.useraction.list') {
            event.preventDefault();
            $state.go('admin.mobile.useraction.list');
        }
    });
    $scope.init = function () {
        console.log('AdminMobileUserActionController loaded!');
        $state.go('admin.mobile.useraction.list');
    };
    $scope.init();
}]);

admin.controller('AdminMobileUserActionListController', [
    '$scope', '$state', 'mobileUserActionService', 'blockUI', '$dialog', '$filter',
    function ($scope, $state, mobileUserActionService, blockUI, $dialog, $filter) {

        $scope.loadSObjects = function () {
            if (!$scope.blockUI.loadSObjects.state().blocking) {
                $scope.blockUI.loadSObjects.start('Loading local sobjects...');
                mobileUserActionService.loadSObjects({ includeFields: true })
                    .success(function (response) {
                        if (response.success) {
                            $scope.sObjects = $filter('filter')(response.data.sObjects, { forMobile: true });
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

        $scope.loadUserAction = function () {
            if (!$scope.blockUI.userAction.state().blocking) {
                $scope.blockUI.userAction.start('Loading User Action...');
                mobileUserActionService.loadUserAction({})
                    .success(function (response) {
                        if (response.success) {
                            $scope.userActions = response.data.userActions;
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.userAction.stop();
                    })
                    .error(function (response) {
                        $dialog.alert('Error occured while loading local sobjects.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.userAction.stop();
                    });
            }
        }

        $scope.manageSObjectFields = function (userAction) {
            $state.go('admin.mobile.useraction.manageuseracitonfields', { useraction: userAction });
        }
        $scope.deleteUserAction = function (userAction) {
            $dialog.confirm({
                title: 'Confirm delete ?',
                yes: 'Yes, Delete', no: 'Cancel',
                message: 'All information related to ' + userAction.actionvalue + ' of ' + userAction.SObject.label + ' will be deleted. \nAre you sure ?',
                class: 'danger'
            }, function (confirm) {
                if (confirm) {
                    if (!$scope.blockUI.userAction.state().blocking) {
                        $scope.blockUI.userAction.start('Deleting User Action...');
                        mobileUserActionService.deleteUserAction({ id: userAction.id })
                            .success(function (response) {
                                if (response.success) {
                                    $dialog.alert("User Action Deleted successfully", '', '');
                                } else {
                                    $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                                }
                                $scope.blockUI.userAction.stop();
                                $scope.loadUserAction();
                            })
                            .error(function (response) {
                                $dialog.alert('Error occured while deleting User Action.', 'Error', 'pficon pficon-error-circle-o');
                                $scope.blockUI.userAction.stop();
                            });
                    }
                }
            });

        }

        $scope.onSobjectChange = function (sObject) {
            if (sObject != null) {
                $scope.sObjectFields = [];
                var sObjectFieldsData = $filter('filter')(sObject.SObjectFields, { type: 'picklist'});
                angular.forEach(sObjectFieldsData, function (field) {
                    if(field.name=='User_Actions__c' || field.name=='akritivesm__User_Actions__c' ){
                        $scope.sObjectFields.push(field);
                    }
                });
            }
            else {
                $scope.sObjectFields = [];
            }
        }
        $scope.onSobjectFieldChange = function (sObjectFields) {
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
                $dialog.alert("Please Select Sobject Field", 'Error', 'pficon pficon-error-circle-o');
            }
            else if ($scope.data.SObjectFieldValue == undefined || $scope.data.SObjectFieldValue == null || $scope.data.SObjectFieldValue == "") {
                $dialog.alert("Please Select Value", 'Error', 'pficon pficon-error-circle-o');
            }
            else {
                if (!$scope.blockUI.userAction.state().blocking) {
                    $scope.blockUI.userAction.start('Saving User Action...');
                    mobileUserActionService.saveUserAction({ actionvalue: $scope.data.SObjectFieldValue, SObjectId: $scope.data.SObject.id })
                        .success(function (response) {
                            if (response.success) {
                                $scope.data.SObjectFieldValue="";
                                $dialog.alert("User Action Added successfully", '', '');
                            } else {
                                $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                            }
                            $scope.blockUI.userAction.stop();
                            $scope.loadUserAction();
                        })
                        .error(function (response) {
                            $dialog.alert('Error occured while adding User Action.', 'Error', 'pficon pficon-error-circle-o');
                            $scope.blockUI.userAction.stop();
                        });
                }

            }
        }


        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                loadSObjects: blockUI.instances.get('loadSObjects'),
                userAction: blockUI.instances.get('useraction')
            };
        };
        $scope.init = function () {
            $scope.data = {};
            $scope.sObjectFields = [];
            $scope.sObjectFieldsValue = [];
            console.log('AdminMobileUserActionListController loaded!');
            $scope.initBlockUiBlocks();
            $scope.loadSObjects();
            $scope.loadUserAction();
        };
        $scope.init();
    }]);

admin.controller('AdminMobileUserActionFieldController', [
    '$scope', '$state', '$stateParams', '$controller', 'mobileUserActionService', 'sobjectService', 'blockUI', '$dialog', '$timeout', '$adminLookups', 'genericComponentService', 'staticComponentService', '$filter',
    function ($scope, $state, $stateParams, $controller, mobileUserActionService, sobjectService, blockUI, $dialog, $timeout, $adminLookups, genericComponentService, staticComponentService, $filter) {
        var thisCtrl = this;
        $scope.loadSObjectFields = function () {
            if (!$scope.blockUI.userActionField.state().blocking && $scope.layout.SObject != null) {
                $scope.blockUI.userActionField.start('Loading Fields...');
                sobjectService.loadSObjectFields($scope.layout.SObject)
                    .success(function (response) {
                        if (response.success) {
                            $scope.layout.SObject.fields = []; // = response.data.sObjectFields;
                            // $scope.refSObjects = response.data.refSObjects;
                            $scope.dataSObjectFields = response.data.sObjectFields = $filter('filter')(response.data.sObjectFields, { forMobile: true });
                            mobileUserActionService.loadUserActionFields($scope.layout)
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
                                    $scope.blockUI.userActionField.stop();
                                })
                                .error(function (response) {
                                    $dialog.alert('Error occured while loading sobject fields.', 'Error', 'pficon pficon-error-circle-o');
                                    $scope.blockUI.userActionField.stop();
                                });
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                            $scope.blockUI.userActionField.stop();
                        }
                        
                    })
                    .error(function (response) {
                        $dialog.alert('Error occured while loading sobject fields.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.userActionField.stop();
                    });
            }
        };

        $scope.returnToList = function () {
            $state.go('admin.mobile.useraction.list');
        };
        $scope.changeAction = function (field, action) {
            if (action == 'readonly' && field.readonly == true) {
                field.required = false;
                field.optional = false;
            }
            else if (action == 'required' && field.required == true) {
                field.readonly = false;
                field.optional = false;
            }
            else if (action == 'optional' && field.optional == true) {
                field.readonly = false;
                field.required = false;
            }

        };
        $scope.saveLayout = function () {
            if (!$scope.blockUI.userActionField.state().blocking && $scope.layout.SObject != null) {
                $scope.blockUI.userActionField.start('Saving ...');
                var data = {
                    userAction: $scope.layout,
                    actionFields: $scope.layout.SObject.fields,
                }
                mobileUserActionService.saveUserActionFields(data)
                    .success(function (response) {
                        $scope.blockUI.userActionField.stop();
                        if (response.success === true) {
                            // $scope.loadSObjectFields();
                        } else {
                            $dialog.alert('Error occured while saving layout.', 'Error', 'pficon pficon-error-circle-o');
                        }
                    })
                    .error(function (response) {
                        $scope.blockUI.userActionField.stop();
                        $dialog.alert('Server error occured while saving layout.', 'Error', 'pficon pficon-error-circle-o');
                    });
            }
        };

        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                userActionField: blockUI.instances.get('useractionfield'),
            };
        };
        $scope.init = function () {
            console.log('AdminMobileUserActionFieldController loaded!');

            $scope.initBlockUiBlocks();
            $scope.layout = $stateParams.useraction;
            $scope.loadSObjectFields();

        };
        $scope.init();
    }
]);