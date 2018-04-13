'use strict';

admin.controller('AdminBulkCreationConfigController', [
    '$scope', '$rootScope', '$state', '$adminLookups', 'CSVUploadConfigService', 'blockUI', '$dialog',
    function ($scope, $rootScope, $state, $adminLookups, CSVUploadConfigService, blockUI, $dialog) {

        $scope.openSObjectsLookup = function (SObject) {
            var whereClause = {
                criteria: {
                    includeFields: true
                }
            };
            if (SObject === 'detailSObject') {
                if (!$scope.SObject) {
                    $dialog.alert('Please select SObject.', 'Error', 'pficon pficon-error-circle-o');
                    return;
                }
            }
            $adminLookups.sObject(whereClause, function (sObject) {
                if (sObject !== undefined) {
                    if (SObject !== 'detailSObject') {
                        if ($scope.SObject == undefined || $scope.SObject.id == sObject.id) {
                            $scope.SObject = sObject;
                        }
                        else {
                            $scope.SObject = sObject;
                            angular.forEach($scope.valueMapping, function (field, index) {
                                if (field.SObjectId != undefined && field.SObjectId != $scope.SObject.id) {
                                    $scope.valueMapping.splice(index, 1);
                                }
                            });
                            angular.forEach($scope.fieldMapping, function (field, index) {
                                if (field.SObjectId != undefined && field.SObjectId != $scope.SObject.id) {
                                    $scope.fieldMapping.splice(index, 1);
                                }
                            });
                        }
                    }
                    else {
                        if ($scope.detailSObject == undefined || $scope.detailSObject.id == sObject.id) {
                            $scope.detailSObject = sObject;
                        }
                        else {
                            $scope.detailSObject = sObject;
                            angular.forEach($scope.valueMapping, function (field, index) {
                                if (field.detailSObjectId != undefined && field.detailSObjectId != $scope.detailSObject.id) {
                                    $scope.valueMapping.splice(index, 1);
                                }
                            });
                            angular.forEach($scope.fieldMapping, function (field, index) {
                                if (field.detailSObjectId != undefined && field.detailSObjectId != $scope.detailSObject.id) {
                                    $scope.fieldMapping.splice(index, 1);
                                }
                            });
                        }
                    }
                }
            });
        };

        $scope.getFieldMapping = function () {
            if (!$scope.blockUI.sObjectFieldsMapping.state().blocking) {
                $scope.blockUI.sObjectFieldsMapping.start('Loading ...');
                CSVUploadConfigService.getFieldMapping()
                    .success(function (response) {
                        if (response.success) {
                            angular.forEach(response.data.mappedFields, function (field) {
                                if ($scope.SObject == undefined && field.SObjectId != undefined) {
                                    $scope.SObject = field.SObject;
                                    field.isOf = "mainSObject";
                                    field.SObjectName = $scope.SObject.label;
                                }
                                else if ($scope.detailSObject == undefined && field.detailSObjectId != undefined) {
                                    $scope.detailSObject = field.detailSObject;
                                    field.isOf = "detailSObject";
                                    field.SObjectName = $scope.detailSObject.label;
                                }
                                else if ($scope.SObject && $scope.SObject.id == field.SObjectId) {
                                    field.isOf = "mainSObject";
                                    field.SObjectName = $scope.SObject.label;
                                }
                                else if ($scope.detailSObject && $scope.detailSObject.id == field.detailSObjectId) {
                                    field.isOf = "detailSObject";
                                    field.SObjectName = $scope.detailSObject.label;
                                }
                                field.type = field.datatype;
                                delete field.datatype;
                                field.name = field.sfFieldName;
                                delete field.sfFieldName;
                                field.subtype = 'SObject-Mapping-Field';
                                field.columns = 1;

                                if (field.isOf == "mainSObject") {
                                    angular.forEach($scope.SObject.SObjectFields, function (_field) {
                                        if (field.name == _field.name) {
                                            field.id = _field.id;
                                            field.deleted = false;
                                        }
                                    });

                                    if (field.type == "reference") {
                                        angular.forEach($scope.SObject.SObjectFields, function (_field) {
                                            if (field.name == _field.name) {
                                                field.SObjectField = angular.copy(_field);
                                            }
                                        });
                                    }
                                }

                                if (field.isOf == "detailSObject") {
                                    angular.forEach($scope.detailSObject.SObjectFields, function (_field) {
                                        if (field.name == _field.name) {
                                            field.id = _field.id;
                                            field.deleted = false;
                                        }
                                    });

                                    if (field.type == "reference") {
                                        angular.forEach($scope.detailSObject.SObjectFields, function (_field) {
                                            if (field.name == _field.name) {
                                                field.SObjectField = angular.copy(_field);
                                            }
                                        });
                                    }
                                }
                            });

                            angular.forEach(response.data.mappedFields, function (field, fieldOrder) {
                                field.order = fieldOrder;
                                if (field.mappingType == "Value Mapping") {
                                    $scope.valueMapping.push(field);
                                }
                                else if (field.mappingType == "Field Mapping") {
                                    $scope.fieldMapping.push(field);
                                }
                            });
                        }
                        else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.sObjectFieldsMapping.stop();
                    })
                    .error(function () {
                        $dialog.alert('Error occured while loading config fields.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.sObjectFieldsMapping.stop();
                    });
            }
        };

        $scope.fieldsDropCallBack = function (event, index, item, external, type, section, columnNumber) {
            if ($scope.isDuplicate(item)) {
                return false;
            }

            item.subtype = 'SObject-Mapping-Field';
            item.columns = columnNumber;
            item.order = index;
            item.defaultValue = '';
            item.csvFieldName = '';

            if ($scope.SObject && $scope.SObject.id == item.SObjectId) {
                item.isOf = "mainSObject";
                item.SObjectName = $scope.SObject.label;
            }
            else if ($scope.detailSObject && $scope.detailSObject.id == item.SObjectId) {
                item.isOf = "detailSObject";
                item.detailSObjectId = item.SObjectId;
                item.SObjectName = $scope.detailSObject.label;
            }

            angular.forEach(section, function (field, fieldOrder) {
                field.order = fieldOrder;
            });

            return item;
        };

        $scope.isDuplicate = function (item) {
            var duplicate = false;
            angular.forEach($scope.valueMapping, function (field, index) {
                if (!duplicate) {
                    if (field.id === item.id && !field.deleted) {
                        duplicate = true;
                    }
                }
            });
            if (!duplicate) {
                angular.forEach($scope.fieldMapping, function (field, index) {
                    if (!duplicate) {
                        if (field.id === item.id && !field.deleted) {
                            duplicate = true;
                        }
                    }
                });
            }
            return duplicate;
        };

        $scope.removeAndReorder = function (items, item, index) {
            item.deleted = true;
            if (item.id === undefined || item.subtype == "SObject-Mapping-Field") {
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
                    angular.forEach(fields, function (field) {
                        field.deleted = true;
                    });
                });
            }
        };

        $scope.saveFieldMapping = function () {
            var isValid = true;
            angular.forEach($scope.valueMapping, function (config) {
                if (config.defaultValue == '' && isValid) {
                    $dialog.alert("Please enter Default Value for '" + config.label + "' field.");
                    isValid = false;
                }
            });
            if (isValid) {
                angular.forEach($scope.fieldMapping, function (config) {
                    if (config.csvFieldName == '' && isValid) {
                        $dialog.alert("Please enter CSV field name for '" + config.label + "' field.");
                        isValid = false;
                    }
                });

                if (isValid && ($scope.valueMapping.length > 0 || $scope.fieldMapping.length > 0)) {
                    if (!$scope.blockUI.sObjectFieldsMapping.state().blocking && ($scope.valueMapping.length > 0 || $scope.fieldMapping.length > 0)) {
                        $scope.blockUI.sObjectFieldsMapping.start('Loading ...');
                        var configs = angular.copy($scope.valueMapping);
                        angular.forEach(configs, function (config) {
                            config.mappingType = 'Value Mapping';
                        });
                        angular.forEach($scope.fieldMapping, function (config) {
                            config.mappingType = 'Field Mapping';
                            configs.push(config);
                        });
                        CSVUploadConfigService.saveFieldMapping(configs)
                            .success(function (response) {
                                if (response.success) {
                                    $dialog.alert("Field mappings saved successfully.");
                                    $scope.blockUI.sObjectFieldsMapping.stop();
                                    $scope.init();
                                }
                                else {
                                    $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                                    $scope.blockUI.sObjectFieldsMapping.stop();
                                }
                            })
                            .error(function () {
                                $dialog.alert('Error occured while saving field mappings.', 'Error', 'pficon pficon-error-circle-o');
                                $scope.blockUI.sObjectFieldsMapping.stop();
                            });
                    }
                }
            }
        };

        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                sObjectFieldsMapping: blockUI.instances.get('sObjectFieldsMapping')
            };
        };

        $scope.init = function () {
            console.log('AdminBulkCreationConfigController loaded!');
            $scope.sidePanel = 'slds/views/admin/bulkcreationconfig/sidepanel.html';
            $scope.dropZone = 'slds/views/admin/bulkcreationconfig/dropzone.html';
            $scope.initBlockUiBlocks();
            $scope.SObject = undefined;
            $scope.detailSObject = undefined;
            $scope.valueMapping = [];
            $scope.fieldMapping = [];
            $scope.getFieldMapping();
        };
        $scope.init();
    }]);