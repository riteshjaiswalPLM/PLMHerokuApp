'use strict';

admin.controller('AdminBulkCreationConfigController', [
    '$scope', '$rootScope', '$state', '$adminLookups', 'CSVUploadConfigService', 'sobjectService', 'blockUI', '$dialog',
    function ($scope, $rootScope, $state, $adminLookups, CSVUploadConfigService, sobjectService, blockUI, $dialog) {

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
                if (SObject !== 'detailSObject') {
                    $scope.SObject = sObject;
                    var referenceSObjectNames = [];
                    angular.forEach($scope.SObject.SObjectFields, function (field) {
                        if (field.type === 'reference') {
                            field.SObjectField = angular.copy(field);
                            if (referenceSObjectNames.indexOf(field.referenceTo[0]) === -1) {
                                referenceSObjectNames.push(field.referenceTo[0]);
                            }
                        }
                    });
                    var where = { referenceSObjectNames: referenceSObjectNames };
                    sobjectService.loadSObjects(where)
                        .success(function (response) {
                            if (response.success === true) {
                                angular.forEach(response.data.sObjects, function (sObject, sObjectIndex) {
                                    $scope.refSObjects[sObject.name] = sObject;
                                });
                            }
                        });
                }
                else {
                    $scope.detailSObject = sObject;
                    var referenceSObjectNames = [];
                    angular.forEach($scope.detailSObject.SObjectFields, function (field) {
                        if (field.type === 'reference') {
                            field.SObjectField = angular.copy(field);
                            if (referenceSObjectNames.indexOf(field.referenceTo[0]) === -1) {
                                referenceSObjectNames.push(field.referenceTo[0]);
                            }
                        }
                    });
                    var where = { referenceSObjectNames: referenceSObjectNames };
                    sobjectService.loadSObjects(where)
                        .success(function (response) {
                            if (response.success === true) {
                                angular.forEach(response.data.sObjects, function (sObject, sObjectIndex) {
                                    $scope.refSObjects[sObject.name] = sObject;
                                });
                            }
                        });
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
                                    var referenceSObjectNames = [];
                                    angular.forEach($scope.SObject.SObjectFields, function (_field) {
                                        if (_field.type === 'reference') {
                                            _field.SObjectField = angular.copy(_field);
                                            if (referenceSObjectNames.indexOf(_field.referenceTo[0]) === -1) {
                                                referenceSObjectNames.push(_field.referenceTo[0]);
                                            }
                                        }
                                    });
                                    var where = { referenceSObjectNames: referenceSObjectNames };
                                    sobjectService.loadSObjects(where)
                                        .success(function (response) {
                                            if (response.success === true) {
                                                angular.forEach(response.data.sObjects, function (sObject, sObjectIndex) {
                                                    $scope.refSObjects[sObject.name] = sObject;
                                                });
                                            }
                                        });
                                }
                                else if ($scope.detailSObject == undefined && field.detailSObjectId != undefined) {
                                    $scope.detailSObject = field.detailSObject;
                                    field.isOf = "detailSObject";
                                    field.SObjectName = $scope.detailSObject.label;
                                    var referenceSObjectNames = [];
                                    angular.forEach($scope.detailSObject.SObjectFields, function (_field) {
                                        if (_field.type === 'reference') {
                                            _field.SObjectField = angular.copy(_field);
                                            if (referenceSObjectNames.indexOf(_field.referenceTo[0]) === -1) {
                                                referenceSObjectNames.push(_field.referenceTo[0]);
                                            }
                                        }
                                    });
                                    var where = { referenceSObjectNames: referenceSObjectNames };
                                    sobjectService.loadSObjects(where)
                                        .success(function (response) {
                                            if (response.success === true) {
                                                angular.forEach(response.data.sObjects, function (sObject, sObjectIndex) {
                                                    $scope.refSObjects[sObject.name] = sObject;
                                                });
                                            }
                                        });
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
                                            field.nillable = _field.nillable;
                                            field.deleted = false;
                                        }
                                    });

                                    if (field.type == "reference") {
                                        angular.forEach($scope.SObject.SObjectFields, function (_field) {
                                            if (field.name == _field.name) {
                                                field.SObjectField = angular.copy(_field);
                                            }
                                        });
                                        field.refSObjects = {};
                                    }
                                }

                                if (field.isOf == "detailSObject") {
                                    angular.forEach($scope.detailSObject.SObjectFields, function (_field) {
                                        if (field.name == _field.name) {
                                            field.id = _field.id;
                                            field.nillable = _field.nillable;
                                            field.deleted = false;
                                        }
                                    });

                                    if (field.type == "reference") {
                                        angular.forEach($scope.detailSObject.SObjectFields, function (_field) {
                                            if (field.name == _field.name) {
                                                field.SObjectField = angular.copy(_field);
                                            }
                                        });
                                        field.refSObjects = {};
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
            var sectionFields = section;

            if ($scope.isDuplicate(sectionFields, item)) {
                return false;
            }

            item.subtype = 'SObject-Mapping-Field';
            item.columns = columnNumber;
            item.order = index;
            item.defaultValue = '';
            item.isUniqueField = false;
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

        $scope.isDuplicate = function (fields, item) {
            var duplicate = false;
            angular.forEach(fields, function (field, index) {
                if (!duplicate) {
                    if (field.id === item.id && !field.deleted) {
                        duplicate = true;
                    }
                }
            });
            return duplicate;
        };

        $scope.removeFieldsStore = function (section, item) {
            if (section.deletedFields == undefined) {
                section.deletedFields = [];
            }
            section.deletedFields.push(item);
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

        $scope.syncUniqueRadio = function (thisfield) {
            var fields = $scope.fieldMapping;
            angular.forEach(fields, function (field) {
                field.isUniqueField = false;
            });
            thisfield.isUniqueField = true;
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
                var fieldMappingConfigs = $scope.fieldMapping;
                var isUniqueFieldConfigured = false;
                angular.forEach(fieldMappingConfigs, function (config) {
                    if (config.isUniqueField) {
                        isUniqueFieldConfigured = true;
                    }
                    if (config.csvFieldName == '' && isValid) {
                        $dialog.alert("Please enter CSV field name for '" + config.label + "' field.");
                        isValid = false;
                    }
                });

                if (isValid && fieldMappingConfigs.length > 0) {
                    if (!isUniqueFieldConfigured) {
                        $dialog.alert("Please select Unique field.");
                    }
                    else {
                        if (!$scope.blockUI.sObjectFieldsMapping.state().blocking && $scope.valueMapping.length > 0) {
                            $scope.blockUI.sObjectFieldsMapping.start('Loading ...');
                            var configs = angular.copy($scope.valueMapping);
                            angular.forEach(configs, function (config) {
                                config.mappingType = 'Value Mapping';
                            });
                            angular.forEach(fieldMappingConfigs, function (config) {
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
            $scope.refSObjects = {};
            $scope.valueMapping = [];
            $scope.fieldMapping = [];
            $scope.getFieldMapping();
        };
        $scope.init();
    }]);