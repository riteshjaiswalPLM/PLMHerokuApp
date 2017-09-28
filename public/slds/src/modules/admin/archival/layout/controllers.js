admin.controller('AdminArchivalLayoutsController', ['$scope', '$rootScope', '$state', function ($scope, $rootScope, $state) {
    $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams, options) {
        if (toState.name === 'admin.archival.layouts' && fromState !== 'admin.archival.layouts.list') {
            event.preventDefault();
            $state.go('admin.archival.layouts');
        }
    });
    $scope.init = function () {
        console.log('AdminArchivalLayoutsController loaded!');
        $state.go('admin.archival.layouts.list');
    };
    $scope.init();
}]);

admin.controller('AdminArchivalLayoutsListController', [
    '$scope', '$state', 'archivalService', 'blockUI', '$dialog',
    function ($scope, $state, archivalService, blockUI, $dialog) {

        $scope.loadSObjects = function () {
            if (!$scope.blockUI.loadSObjects.state().blocking) {
                $scope.blockUI.loadSObjects.start('Loading layouts...');
                archivalService.loadSObjects({
                    criteria: {
                        where: {
                            created: true,
                            type: 'Archival'
                        }
                    }
                })
                    .success(function (response) {
                        if (response.success) {
                            $scope.layouts = response.data.layouts;
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.loadSObjects.stop();
                    })
                    .error(function (response) {
                        $dialog.alert('Error occured while loading layouts.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.loadSObjects.stop();
                    });
            }
        };

        $scope.changeActive = function (layout) {
            // $dialog.alert('changing from ' + !layout.active + ' to ' + layout.active + '.');
            var message = (layout.active) ? 'Activating' : 'Deactivating';
            $scope.blockUI.loadSObjects.start(message + ' "' + layout.SObject.label + ' ' + layout.type + '" layout...');
            archivalService.changeActive(layout)
                .success(function (response) {
                    if (!response.success) {
                        layout.active = !layout.active;
                    }
                    $scope.blockUI.loadSObjects.stop();
                })
                .error(function (response) {
                    $scope.blockUI.loadSObjects.stop();
                    $dialog.alert('Error occured while ' + message.toLowerCase() + ' layout.', 'Error', 'pficon pficon-error-circle-o');
                });
        };

        $scope.search = function (layout) {
            layout.tempType = 'List';
            $state.go('admin.archival.layouts.edit', { layout: layout });
        };
        $scope.edit = function (layout) {
            layout.tempType = 'Edit';
            $state.go('admin.archival.layouts.edit', { layout: layout });
        };


        $scope.searchResultFieldsDropCallBack = function (event, index, item, external, type, allowedType) {
            if (item.SObjectField.type !== 'reference' && $scope.isDuplicate($scope.searchResultFields, item)) {
                return false;
            }
            item.type = 'Search-Result-Field';
            return item;
        };

        $scope.deleteSObject = function (sObject) {
            $dialog.confirm({
                title: 'Confirm delete ?',
                yes: 'Yes, Delete', no: 'Cancel',
                message: 'All information related to ' + sObject.label + ' will be deleted. \nAre you sure ?',
                class: 'destructive',
                headerClass: 'error'
            }, function (confirm) {
                if (confirm) {
                    $scope.blockUI.loadSObjects.start('Deleting ' + sObject.label + '...');
                    archivalService.deleteSObject(sObject)
                        .success(function (response) {
                            $scope.blockUI.loadSObjects.stop();
                            if (response.success) {
                                $scope.loadSObjects();
                            } else {
                                $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                            }
                        })
                        .error(function (response) {
                            $scope.blockUI.loadSObjects.stop();
                            $dialog.alert('Error occured while deleting sObject.', 'Error', 'pficon pficon-error-circle-o');
                        });
                }
            });
        }

        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                loadSObjects: blockUI.instances.get('loadSObjects'),
                synchronizeLayouts: blockUI.instances.get('synchronizeLayouts')
            };
        };

        $scope.syncronize = function () {
            var soobjectList = [];
            $dialog.confirm({
                title: 'Confirm synchronization ?',
                yes: 'Yes', no: 'No',
                message: '<h1>Syncronaztion may affect existing configuration.</h1><br><ul><li>It may remove referrence from Layouts, My Task, Search Config, Mobile Application config, etc.. of deleted object(s)/field(s) which might be used in.</li><li>Picklist value might be modified/deleted which might be in use.</li></ul>',
                class: 'destructive',
                headerClass: 'error'
            }, function (confirm) {
                if (confirm) {
                    $scope.blockUI.synchronizeLayouts.start('Synchronizing archivalConfigs with Salesforce...');
                    archivalService.syncArchivalConfigs(soobjectList).
                        success(function (response) {
                            $scope.blockUI.synchronizeLayouts.stop();
                        }).
                        error(function (response) {
                            $dialog.alert('Error occured while synchronization.', 'Error', 'pficon pficon-error-circle-o');
                            $scope.blockUI.synchronizeLayouts.stop();
                        });

                }

            });
        };


        $scope.init = function () {
            console.log('AdminArchivalLayoutsListController loaded!');
            $scope.initBlockUiBlocks();
            $scope.loadSObjects();
            $scope.filterStr = {};
        };
        $scope.init();
    }]);




admin.controller('AdminArchivalLayoutsEditController', [
    '$scope', '$state', '$stateParams', '$controller', 'archivalService', 'sobjectService', 'blockUI', '$dialog', '$timeout', '$adminLookups', 'genericComponentService', 'staticComponentService', '$filter',
    function ($scope, $state, $stateParams, $controller, archivalService, sobjectService, blockUI, $dialog, $timeout, $adminLookups, genericComponentService, staticComponentService, $filter) {
        var thisCtrl = this;
        $scope.loadSObjectFields = function () {
            if (!$scope.blockUI.sObjectFields.state().blocking && $scope.layout.SObject != null) {
                $scope.blockUI.sObjectFields.start('Loading ...');
                archivalService.loadSObjectFields($scope.layout)
                    .success(function (response) {
                        if (response.success) {
                            $scope.layout.SObject.fields = []; // = response.data.sObjectFields;
                            $scope.refSObjects = response.data.refSObjects;
                            //console.log("refSObjects",$scope.refSObjects);
                            // response.data.sObjectFields = $filter('filter')(response.data.sObjectFields, { forMobile: true });
                            console.log("sObjectFields", response.data.sObjectFields);
                            angular.forEach(response.data.sObjectFields, function (field) {
                                var ControllerSObjectField = undefined;
                                if (field.controllerName && (field.type === 'picklist' || field.type === 'multipicklist')) {
                                    angular.forEach(response.data.sObjectFields, function (ctrlField) {
                                        if (ctrlField.name === field.controllerName) {
                                            ControllerSObjectField = ctrlField;
                                        }
                                    });
                                }
                                var SObjectLayoutField = {
                                    SObjectField: field,
                                    ControllerSObjectField: ControllerSObjectField,
                                    label: field.label,
                                    type: null,
                                    hidden: false,
                                    deleted: false,
                                    recordid: field.type === 'id',
                                    SObjectLayoutId: $scope.layout.id
                                };
                                $scope.layout.SObject.fields.push(SObjectLayoutField);
                            });
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.sObjectFields.stop();
                    })
                    .error(function (response) {
                        $dialog.alert('Error occured while loading sobject fields.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.sObjectFields.stop();
                    });
            }
        };
        $scope.loadChildSObjects = function () {
            if (($scope.layout.tempType === 'Edit' || $scope.layout.tempType === 'Details') && !$scope.blockUI.childSObjects.state().blocking && $scope.layout.SObject != null) {
                $scope.blockUI.childSObjects.start('Loading ...');
                $scope.layout.SObject.mobile = true;
                sobjectService.loadChildSObjects($scope.layout.SObject)
                    .success(function (response) {
                        if (response.success) {
                            $scope.layoutRelatedLists = [];
                            angular.forEach(response.data.sObjectFields, function (sObjectField) {
                                $scope.layoutRelatedLists.push({
                                    SObject: sObjectField.SObject,
                                    title: sObjectField.SObject.labelPlural,
                                    active: true,
                                    deleted: false,
                                    readonly: false
                                });
                            });
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.childSObjects.stop();
                    })
                    .error(function (response) {
                        $dialog.alert('Error occured while loading sobject fields.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.childSObjects.stop();
                    });
            }
        };
        $scope.components = function () {
            if ($scope.layout.tempType !== 'List' && $scope.componentsValues === undefined) {
                $scope.componentsValues = [{
                    title: 'Layout Section',
                    deleted: false,
                    readonly: false,
                    active: true,
                    isComponent: false,
                    SObjectLayoutId: undefined,
                    columns: [
                        []
                    ]
                }];
            }
            return $scope.componentsValues;
        };

        $scope.returnToList = function () {
            if ($scope.showSideBar) {
                $scope.backToLayoutConfig()
            }
            else {
                $state.go('admin.archival.layouts.list');
            }
        };
        $scope.removeFieldsAndStoreAndReorder = function (type, items, item, index) {
            var subRemoveAndReorder = function (items, item, index) {
                item.deleted = true;
                if (item.id === undefined || item.type == "Layout-Section-Field" || item.type == "Search-Criteria-Field" || item.type == "Search-Result-Field") {
                    items.splice(index, 1);
                }
                var itemIndex = 0;
                angular.forEach(items, function (i, _index) {
                    if (!i.deleted) {
                        i.order = itemIndex;
                        itemIndex++;
                    }
                });

                if (item.columns !== undefined && angular.isArray(item.columns)) {
                    angular.forEach(item.columns, function (fields) {
                        angular.forEach(fields, function (field, fieldIndex) {
                            field.deleted = true;
                        });
                    });
                }
            }
            if (item.fromfield || item.tofield) {
                $dialog.confirm({
                    title: 'Want to remove field?',
                    yes: 'Yes', no: 'No',
                    message: 'Select item is ' + (item.fromfield ? 'from' : 'to') + ' field of range search.\nRemoval of this field will remove corresponding ' + (item.fromfield ? 'to' : 'from') + ' field of range search.',
                    class: 'destructive',
                    headerClass: 'error'
                }, function (confirm) {
                    if (confirm) {
                        var toFromPair = [{ item: item, index: index }];
                        angular.forEach(items, function (i, _index) {
                            if (i.SObjectField.name === item.SObjectField.name && index != _index) {
                                if (index < _index) {
                                    toFromPair.push({ item: i, index: _index - 1 });
                                }
                                else {
                                    toFromPair.push({ item: i, index: _index });
                                }
                            }
                        });
                        $scope.removeFieldsAndStore(type, toFromPair[0].item);
                        $scope.removeFieldsAndStore(type, toFromPair[1].item);
                        subRemoveAndReorder(items, toFromPair[0].item, toFromPair[0].index);
                        subRemoveAndReorder(items, toFromPair[1].item, toFromPair[1].index);
                    }
                });
            }
            else {
                $scope.removeFieldsAndStore(type, item);
                subRemoveAndReorder(items, item, index);
            }
        }
        $scope.removeFieldsAndStore = function (type, item) {
            if (item.id !== undefined) {
                item.deleted = true;
                if (type == "CriteriaField") {
                    if ($scope.searchCriteriaDeletedFields == undefined) {
                        $scope.searchCriteriaDeletedFields = [];
                    }
                    $scope.searchCriteriaDeletedFields.push(item);
                }
                if (type == "ResultField") {
                    if ($scope.searchResultDeletedFields == undefined) {
                        $scope.searchResultDeletedFields = [];
                    }
                    $scope.searchResultDeletedFields.push(item);
                }
            }
        }


        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                editLayout: blockUI.instances.get('editLayout'),
                sObjectFields: blockUI.instances.get('sObjectFields'),
                childSObjects: blockUI.instances.get('childSObjects'),
            };
        };

        $scope.init = function () {
            console.log('AdminArchivalLayoutsEditController loaded!');
            $scope.initBlockUiBlocks();
            $scope.layout = $stateParams.layout;
            $timeout(function () {
                if ($scope.layout.tempType === 'List') {
                    $scope.loadSObjectFields();
                    $scope.loadChildSObjects();
                    $scope.templateUrl = 'slds/views/admin/archival/layouts/edit.list.html';
                    $scope.controller = 'AdminArchivalLayoutsEditListController';
                    angular.extend(thisCtrl, $controller($scope.controller, { $scope: $scope }));
                }
                else {
                    $scope.templateUrl = 'slds/views/admin/archival/layout/edit.edit.html';
                    $scope.controller = 'AdminArchivalLayoutsEditEditController';
                    $scope.showSideBar = $scope.showSideBar ? $scope.showSideBar : false;
                    angular.extend(thisCtrl, $controller($scope.controller, { $scope: $scope }));
                }
            }, 0);
        };
        $scope.init();
    }
]);

admin.controller('AdminArchivalLayoutsEditListController', [
    '$scope', '$state', '$stateParams', 'archivalService', 'sobjectService', 'blockUI', '$dialog', '$timeout', '$adminLookups', '$adminModals',
    function ($scope, $state, $stateParams, archivalService, sobjectService, blockUI, $dialog, $timeout, $adminLookups, $adminModals) {
        $scope.searchCriteriaFieldsDropCallBack = function (event, index, item, external, type, allowedType) {
            if ($scope.isDuplicate($scope.searchCriteriaFields, item)) {
                return false;
            }
            item.type = 'Search-Criteria-Field';
            var rangeAllowedDataTypes = ['date', 'datetime', 'double', 'int', 'currency'];
            if (rangeAllowedDataTypes.indexOf(item.SObjectField.type) > -1) {
                if (!angular.isDefined(item.tofield) && !angular.isDefined(item.fromfield)) {
                    $dialog.confirm({
                        title: 'Allow to search range?',
                        yes: 'Yes', no: 'No',
                        message: 'Selected field is of type ' + item.SObjectField.type + '. Do you want this field to allow to search in range?\nIf you agree, it will generate to and from field for you.',
                        class: 'primary'
                    }, function (confirm) {
                        if (confirm) {
                            var itemTo = angular.copy(item);
                            if (!itemTo.toField) {
                                itemTo.label = itemTo.label + ' to';
                                itemTo.tofield = true;
                                $scope.searchCriteriaFields.splice(index + 1, 0, itemTo);
                            }
                            item.fromfield = true;
                            item.label = item.label + ' from';
                        }
                    });
                }
            }
            return item;
        };
        $scope.searchResultFieldsDropCallBack = function (event, index, item, external, type, allowedType) {
            if (item.SObjectField.type !== 'reference' && $scope.isDuplicate($scope.searchResultFields, item)) {
                return false;
            }
            item.type = 'Search-Result-Field';
            return item;
        };
        $scope.isDuplicate = function (fields, item) {
            var duplicate = false;
            angular.forEach(fields, function (field, index) {
                if (!duplicate) {
                    if (field.SObjectField.id === item.SObjectField.id && item.type === null && !field.deleted) {
                        duplicate = true;
                    }
                }
            });
            return duplicate;
        };
        $scope.loadListLayoutFields = function () {
            if (!$scope.blockUI.editListLayout.state().blocking && $scope.layout.SObject != null) {
                $scope.blockUI.editListLayout.start('Loading ...');
                archivalService.loadListLayoutFields($scope.layout)
                    .success(function (response) {
                        if (response.success) {
                            $scope.searchCriteriaFields = [];
                            $scope.searchResultFields = [];
                            $scope.searchCriteriaDeletedFields = [];
                            $scope.searchResultDeletedFields = [];
                            angular.forEach(response.data.sObjectLayoutFields, function (field) {
                                if (field.type === 'Search-Criteria-Field') {
                                    $scope.searchCriteriaFields.push(field);
                                } else {
                                    $scope.searchResultFields.push(field);
                                }
                            });
                        } else {
                            $dialog.alert('Error occured while loading layout fields.', 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.editListLayout.stop();
                    })
                    .error(function (response) {
                        $dialog.alert('Server error occured while loading layout fields.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.editListLayout.stop();
                    });
            }
        };
        $scope.openActionButtonCriteriaModal = function (actionButton) {
            $adminModals.criteriaModal({
                title: 'Action Button Criteria | ' + actionButton.title,
                fields: $scope.$parent.$parent.layout.SObject.fields,
                criteria: actionButton.criteria ? actionButton.criteria : null
            }, function (criteria) {
                actionButton.criteria = criteria;
            });
        };
        $scope.saveLayout = function () {
            if (!$scope.blockUI.editListLayout.state().blocking && $scope.layout.SObject != null) {
                $scope.blockUI.editListLayout.start('Saving ...');
                archivalService.saveListLayout($scope.searchCriteriaFields, $scope.searchResultFields, $scope.actionButtonCriteria, $scope.layout.id, $scope.layout.whereClause, $scope.searchCriteriaDeletedFields, $scope.searchResultDeletedFields)
                    .success(function (response) {
                        $scope.blockUI.editListLayout.stop();
                        if (response.success === true) {
                            $scope.loadListLayoutFields();
                        } else {
                            $dialog.alert('Error occured while saving layout.', 'Error', 'pficon pficon-error-circle-o');
                        }
                    })
                    .error(function (response) {
                        $scope.blockUI.editListLayout.stop();
                        $dialog.alert('Server error occured while saving layout.', 'Error', 'pficon pficon-error-circle-o');
                    });
            }
        };
        $scope.initListLayoutBlockUiBlocks = function () {
            $scope.blockUI.editListLayout = blockUI.instances.get('editListLayout');
        };
        $scope.loadActionButtonCriteria = function () {
            $scope.actionButtonCriteria = [];
            $scope.editActionButton = {
                title: 'Edit',
                keyName: 'Edit'
            };
            $scope.actionButtonCriteria.push($scope.editActionButton);
            $scope.detailActionButton = {
                title: 'Details',
                keyName: 'Details'
            };
            $scope.actionButtonCriteria.push($scope.detailActionButton);

            angular.forEach($scope.layout.btnCriteria, function (btnCriteria) {
                if (btnCriteria.keyName === "Edit") {
                    $scope.editActionButton.criteria = btnCriteria.criteria;
                }
                else if (btnCriteria.keyName === "Details") {
                    $scope.detailActionButton.criteria = btnCriteria.criteria;
                }
            });
        };
        $scope.init = function () {
            console.log('AdminArchivalLayoutsEditListController loaded!');
            $scope.initListLayoutBlockUiBlocks();
            $scope.loadListLayoutFields();
            $scope.loadActionButtonCriteria();
        };
        $scope.init();
    }
]);

admin.controller('AdminArchivalLayoutsEditEditController', [
    '$scope', '$state', '$stateParams', 'archivalService', 'sobjectService', 'blockUI', '$dialog', '$timeout', '$adminLookups', '$adminModals',
    function ($scope, $state, $stateParams, archivalService, sobjectService, blockUI, $dialog, $timeout, $adminLookups, $adminModals) {
        $scope.loadGoverningFields = function () {
            if (!$scope.blockUI.editEditLayout.state().blocking && $scope.layout.SObject != null) {
                $scope.blockUI.editEditLayout.start('Loading governing fields...');
                archivalService.loadgoverningfields($scope.layout)
                    .success(function (response) {
                        $scope.blockUI.editEditLayout.stop();
                        if (response.success) {
                            $scope.governingFields = response.data.governingFields;
                            $scope.fieldAPIName = [];
                            $scope.governingFields.forEach(function (field) {
                                $scope.fieldAPIName.push(field.name);
                            });
                        }
                        else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.editEditLayout.stop();
                    })
                    .error(function () {
                        $dialog.alert('Server error occured while loading governing field lists.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.editEditLayout.stop();
                    });
            }
        };
        $scope.loadMobileEditLayoutConfig = function () {
            if (!$scope.blockUI.editMobileLayoutConfig.state().blocking && $scope.layout.SObject != null) {
                $scope.blockUI.editMobileLayoutConfig.start('Loading configured mobile layouts fields...');
                archivalService.loadmobileeditlayoutconfig($scope.layout)
                    .success(function (response) {
                        $scope.blockUI.editMobileLayoutConfig.stop();
                        if (response.success) {
                            $scope.mobileEditLayoutConfigs = response.data.mobileEditLayoutConfigs;
                        }
                        else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.editMobileLayoutConfig.stop();
                    })
                    .error(function () {
                        $dialog.alert('Server error occured while loading configred layout lists.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.editMobileLayoutConfig.stop();
                    });
            }
        };
        $scope.getDisplayText = function (govFieldValue) {
            var displayValue = "";
            Object.keys(govFieldValue).sort().forEach(function (key, index) {
                displayValue += govFieldValue[key];
                if (index < Object.keys(govFieldValue).length - 1)
                    displayValue += " + ";
            });
            return displayValue;
        };
        $scope.changeMobileEditLayoutConfigActive = function (mobileEditLayoutConfig) {
            var message = (mobileEditLayoutConfig.active) ? 'Activating' : 'Deactivating';
            $scope.blockUI.editMobileLayoutConfig.start(message + '" configuration...');
            archivalService.changemobileeditlayoutconfigactive(mobileEditLayoutConfig)
                .success(function (response) {
                    if (!response.success) {
                        mobileEditLayoutConfig.active = !mobileEditLayoutConfig.active;
                    }
                    $scope.blockUI.editMobileLayoutConfig.stop();
                })
                .error(function (response) {
                    $scope.blockUI.editMobileLayoutConfig.stop();
                    $dialog.alert('Server error occured while ' + message.toLowerCase() + ' configred layout lists', 'Error', 'pficon pficon-error-circle-o');
                });
        };
        $scope.editGoverningValue = function (mobileEditLayoutConfig) {
            $scope.mobileEditLayoutConfig = mobileEditLayoutConfig;
        };
        $scope.deleteMobileEditLayoutConfig = function (mobileEditLayoutConfig) {
            $dialog.confirm({
                title: 'Confirm delete ?',
                yes: 'Yes, Delete', no: 'Cancel',
                message: 'All information related configuration for layout for this combination will be deleted. \nAre you sure ?',
                class: 'danger'
            }, function (confirm) {
                if (confirm) {
                    if (!$scope.blockUI.editMobileLayoutConfig.state().blocking) {
                        $scope.blockUI.editMobileLayoutConfig.start('Deleting User Action...');
                        archivalService.deletemobileeditlayoutconfig({ id: mobileEditLayoutConfig.id })
                            .success(function (response) {
                                if (response.success) {
                                    $dialog.alert("Mobile layout configuration Deleted successfully", '', '');
                                } else {
                                    $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                                }
                                $scope.blockUI.editMobileLayoutConfig.stop();
                                $scope.loadMobileEditLayoutConfig();
                            })
                            .error(function (response) {
                                $dialog.alert('Error occured while deleting configuration.', 'Error', 'pficon pficon-error-circle-o');
                                $scope.blockUI.editMobileLayoutConfig.stop();
                            });
                    }
                }
            });
        };
        $scope.cancelMobileEditLayoutConfig = function () {
            $scope.mobileEditLayoutConfig = {};
            $scope.mobileEditLayoutConfig.governingFieldValue = {};
        };
        $scope.saveMobileEditLayoutConfig = function () {
            if (Object.keys($scope.mobileEditLayoutConfig.governingFieldValue).length < $scope.governingFields.length) {
                $dialog.alert('Value for all the governing fields is mandatory.', 'Error', 'pficon pficon-error-circle-o');
                return;
            }
            var newGoverningFieldValue = {};
            var fieldAPIName = [];
            $scope.fieldAPIName.sort().forEach(function (field) {
                newGoverningFieldValue[field] = $scope.mobileEditLayoutConfig.governingFieldValue[field];
            });
            delete $scope.mobileEditLayoutConfig.governingFieldValue;
            $scope.mobileEditLayoutConfig.governingFieldValue = angular.copy(newGoverningFieldValue);
            $scope.mobileEditLayoutConfig.SObjectLayoutId = $scope.layout.id;
            archivalService.savemobileeditlayoutconfig($scope.mobileEditLayoutConfig)
                .success(function (response) {
                    if (response.success) {
                        $scope.cancelMobileEditLayoutConfig();
                        $scope.loadMobileEditLayoutConfig();
                    } else {
                        $scope.loadMobileEditLayoutConfig();
                        $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                    }
                    $scope.blockUI.editMobileLayoutConfig.stop();
                })
                .error(function () {
                    $dialog.alert('Error occured while saving configuration.', 'Error', 'pficon pficon-error-circle-o');
                    $scope.blockUI.editMobileLayoutConfig.stop();
                });
        };
        $scope.isLayoutValidOrNot = function (mobileEditLayoutConfig) {
            var isLayoutInvalid = false;
            if (Object.keys(mobileEditLayoutConfig.governingFieldValue).length < $scope.governingFields.length) {
                isLayoutInvalid = true;
            }
            else if (Object.keys(mobileEditLayoutConfig.governingFieldValue).length > $scope.governingFields.length) {
                isLayoutInvalid = true;
            }
            else {
                Object.keys(mobileEditLayoutConfig.governingFieldValue).sort().forEach(function (key) {
                    isLayoutInvalid = $scope.governingFields.filter(function (field) {
                        return field.name === key;
                    }).length > 0 ? false : true;
                });
            }
            return isLayoutInvalid;
        };
        $scope.manageLayout = function (mobileEditLayoutConfiguration) {
            $scope.mobileEditLayoutConfig = mobileEditLayoutConfiguration;
            $scope.loadChildSObjects();
            $scope.showSideBar = true;
            $scope.loadEditLayoutContents();
            $scope.initEditLayoutBlockUiBlocks();
            $scope.loadSObjectFields();
        };
        $scope.openSectionPropertiesModal = function (section, index) {
            $adminModals.layoutSectionProperties({
                layout: angular.copy($scope.layout),
                section: angular.copy(section)
            }, function (newSection) {
                $scope.layoutSections[index] = newSection;
            });
        };
        $scope.openRelatedListPropertiesModal = function (relatedList, index) {
            $adminModals.relatedListProperties({
                layout: angular.copy($scope.layout),
                relatedList: angular.copy(relatedList)
            }, function (newRelatedList) {
                $scope.relatedLists[index] = newRelatedList;
            });
        };
        $scope.openFieldPropertiesModal = function (section, sectionIndex, columnIndex, field, fieldIndex) {
            $adminModals.layoutFieldProperties({
                layout: angular.copy($scope.layout),
                section: angular.copy(section),
                field: angular.copy(field),
                refSObjects: angular.copy($scope.refSObjects)
            }, function (newField) {
                $scope.layoutSections[sectionIndex].columns[columnIndex][fieldIndex] = newField;
            });
        };
        $scope.sectionsDropCallBack = function (event, index, item, external, type) {
            item.order = index;
            if (item.SObjectLayoutId === undefined) {
                item.SObjectLayoutId = $scope.layout.id;
                $scope.openSectionPropertiesModal(item, index);
            }
            return item;
        };
        $scope.relatedListsDropCallBack = function (event, index, item, external, type, dispaySection) {
            item.order = index;
            item.dispaySection = dispaySection;
            if (item.SObjectLayoutId === undefined) {
                item.SObjectLayoutId = $scope.layout.id;
                item.SObjectLayoutFields = [];
                angular.forEach(item.SObject.SObjectFields, function (field, fieldIndex) {
                    if (field.name === 'Name' || field.name === 'CreatedDate' || field.name === 'CreatedById' || field.name === 'LastModifiedDate' || field.name === 'LastModifiedById') {
                        item.SObjectLayoutFields.push({
                            SObjectField: field,
                            label: field.label,
                            type: 'Related-List-Field',
                            hidden: false,
                            deleted: false,
                        });
                    }
                });
                var itemIndex = 0;
                var newRLists = [];

                angular.forEach($scope.relatedLists, function (i, _index) {
                    if (i.dispaySection == dispaySection) {
                        if (itemIndex === index) {
                            itemIndex++;
                        }
                        i.order = itemIndex;
                        itemIndex++;
                        newRLists.push(i);
                    }
                });
                angular.forEach($scope.relatedLists, function (i, _index) {
                    if (i.dispaySection != dispaySection) {
                        if (itemIndex === index) {
                            itemIndex++;
                        }
                        i.order = itemIndex;
                        itemIndex++;
                        newRLists.push(i);
                    }
                });
                $scope['relatedLists'] = newRLists;
                $scope.openRelatedListPropertiesModal(item, index);
            }
            return item;
        };
        $scope.fieldsDropCallBack = function (event, index, item, external, type, section, columnNumber) {
            var sectionFields = section.columns[0];
            if (section.columns.length === 2) {
                sectionFields = section.columns[0].concat(section.columns[1]);
            }
            if ($scope.isDuplicate(sectionFields, item)) {
                return false;
            }
            item.type = 'Layout-Section-Field';
            item.column = columnNumber;
            item.order = index;
            item.readonly = (section.readonly !== undefined) ? section.readonly : false;
            item.active = (item.active !== undefined) ? item.active : true;
            item.enable = (item.enable !== undefined) ? item.enable : true;

            angular.forEach(section.columns, function (fields) {
                angular.forEach(fields, function (field, fieldOrder) {
                    field.order = fieldOrder;
                });
            });
            return item;
        };

        $scope.loadEditLayoutContents = function () {
            if (!$scope.blockUI.editEditLayoutWithSideBar.state().blocking && $scope.layout.SObject != null) {
                $scope.blockUI.editEditLayoutWithSideBar.start('Loading ...');
                $scope.layout.MobileEditLayoutConfigId = $scope.mobileEditLayoutConfig.id;
                archivalService.loadEditLayoutContents($scope.layout)
                    .success(function (response) {
                        if (response.success === true) {
                            $scope.layoutSections = response.data.sObjectLayoutSections;
                            archivalService.loadLayoutRelatedLists($scope.layout)
                                .success(function (response2) {
                                    if (response2.success === true) {
                                        $scope.relatedLists = response2.data.sObjectLayoutRelatedLists;
                                    } else {
                                        $dialog.alert('Error occured while loading layout related lists.', 'Error', 'pficon pficon-error-circle-o');
                                    }
                                    $scope.blockUI.editEditLayoutWithSideBar.stop();
                                })
                                .error(function (response2) {
                                    $dialog.alert('Server error occured while loading layout related lists.', 'Error', 'pficon pficon-error-circle-o');
                                    $scope.blockUI.editEditLayoutWithSideBar.stop();
                                });
                        } else {
                            $dialog.alert('Error occured while loading layout contents.', 'Error', 'pficon pficon-error-circle-o');
                            $scope.blockUI.editEditLayout.stop();
                        }
                    })
                    .error(function (response) {
                        $dialog.alert('Server error occured while loading layout contents.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.editEditLayout.stop();
                    });
            }
        };
        $scope.saveLayoutRelatedLists = function () {
            if (!$scope.blockUI.editEditLayout.state().blocking && $scope.layout.SObject != null) {
                if ($scope.relatedLists !== undefined && $scope.relatedLists.length > 0) {
                    $scope.blockUI.editEditLayout.start('Saving layout related lists...');
                    archivalService.saveLayoutRelatedLists({
                        relatedLists: $scope.relatedLists,
                        type: $scope.layout.type,
                        id: $scope.layout.id,
                        MobileEditLayoutConfigId: $scope.mobileEditLayoutConfig.id
                    })
                        .success(function (response) {
                            $scope.blockUI.editEditLayout.stop();
                            if (response.success === true) {
                                $scope.loadEditLayoutContents();
                            } else {
                                $dialog.alert('Error occured while saving layout related lists.', 'Error', 'pficon pficon-error-circle-o');
                            }
                        })
                        .error(function (response) {
                            $scope.blockUI.editEditLayout.stop();
                            $dialog.alert('Server error occured while saving layout related lists.', 'Error', 'pficon pficon-error-circle-o');
                        });
                } else {
                    $scope.loadEditLayoutContents();
                }
            }
        };
        $scope.isValidLayout = function () {
            var errorCount = 0;
            angular.forEach($scope.layoutSections, function (section) {
                if (!section.isComponent) {
                    angular.forEach(section.columns, function (fields) {
                        angular.forEach(fields, function (field) {
                            if ((field.SObjectField.type === 'picklist' || field.SObjectField.type === 'multipicklist') && field.SObjectField.controllerName) {
                                var controllerField = $scope.controllerField(field.SObjectField.controllerName);
                                if (controllerField === undefined) {
                                    field.error = 'Parent field is missing!';
                                    errorCount++;
                                } else {
                                    delete field.error;
                                }
                            }
                        });
                    });
                }
            });
            return errorCount === 0;
        };
        $scope.controllerField = function (name) {
            var controllerField = undefined;
            angular.forEach($scope.layoutSections, function (section) {
                angular.forEach(section.columns, function (fields) {
                    angular.forEach(fields, function (field) {
                        if (field.SObjectField.name === name && !field.deleted && controllerField === undefined) {
                            controllerField = field;
                            return controllerField;
                        }
                    });
                });
            });
            return controllerField;
        };
        $scope.saveLayout = function () {
            if (!$scope.isValidLayout()) {
                return;
            }
            if (!$scope.blockUI.editEditLayoutWithSideBar.state().blocking && $scope.layout.SObject != null) {
                $scope.blockUI.editEditLayoutWithSideBar.start('Saving layout...');
                archivalService.saveEditLayout({
                    layoutSections: $scope.layoutSections,
                    type: $scope.layout.type,
                    id: $scope.layout.id,
                    MobileEditLayoutConfigId: $scope.mobileEditLayoutConfig.id
                })
                    .success(function (response) {
                        $scope.blockUI.editEditLayoutWithSideBar.stop();
                        if (response.success === true) {
                            $scope.saveLayoutRelatedLists();
                        } else {
                            $dialog.alert('Error occured while saving layout.', 'Error', 'pficon pficon-error-circle-o');
                        }
                    })
                    .error(function (response) {
                        $scope.blockUI.editEditLayoutWithSideBar.stop();
                        $dialog.alert('Server error occured while saving layout.', 'Error', 'pficon pficon-error-circle-o');
                    });
            }
        };
        $scope.initEditLayoutBlockUiBlocks = function () {
            $scope.blockUI.editEditLayoutWithSideBar = blockUI.instances.get('editEditLayoutWithSideBar');
            $scope.blockUI.editEditLayout = blockUI.instances.get('editEditLayout');
            $scope.blockUI.editMobileLayoutConfig = blockUI.instances.get('EditMobileLayoutConfigBlockUI');
            $scope.blockUI.sObjectFields = blockUI.instances.get('sObjectFields');
        };
        $scope.backToLayoutConfig = function () {
            $scope.cancelMobileEditLayoutConfig();
            $scope.showSideBar = false;
        };
        $scope.init = function () {
            console.log('AdminArchivalLayoutsEditEditController loaded!');
            $scope.layoutSections = [];
            $scope.initEditLayoutBlockUiBlocks();
            $scope.cancelMobileEditLayoutConfig();
            $scope.loadGoverningFields();
            $scope.loadMobileEditLayoutConfig();
        };
        $scope.init();
    }
]);
