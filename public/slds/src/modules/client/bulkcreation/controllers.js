'use strict';

client.controller('csvUploadController', [
    '$scope', '$rootScope', '$state', '$filter', '$stateParams', 'CSVUploadConfigService', 'bulkUploadService', 'blockUI', '$dialog',
    function ($scope, $rootScope, $state, $filter, $stateParams, CSVUploadConfigService, bulkUploadService, blockUI, $dialog) {

        $scope.getFieldMapping = function () {
            $scope.blockUI.bulkUpload.start('Loading ...');
            CSVUploadConfigService.getFieldMapping()
                .success(function (response) {
                    if (response.success) {
                        var fieldIDs = [];
                        var tempUIFields = [];
                        angular.forEach(response.data.mappedFields, function (field) {
                            if (field.mappingType == "Value Mapping") {
                                $scope.valueMapping.push(field);
                                $scope.model[field.sfFieldName] = field.defaultValue;
                                if ($scope.sObjectName == undefined && field.SObjectId != undefined) {
                                    $scope.sObjectName = field.SObject.name;
                                }
                            }
                            else if (field.mappingType == "Field Mapping") {
                                $scope.fieldMapping.push(field);
                                if ($scope.sObjectName == undefined && field.SObjectId != undefined) {
                                    $scope.sObjectName = field.SObject.name;
                                }
                            }
                            else if (field.mappingType == "UI Field") {
                                angular.forEach(field.SObject.SObjectFields, function (_field) {
                                    if (_field.name == field.sfFieldName) {
                                        field.SObjectField = angular.copy(_field);
                                        fieldIDs.push(field.SObjectField.id);
                                    }
                                });
                                var newField = angular.copy(field);
                                delete newField.SObject.SObjectFields;
                                tempUIFields.push(newField);
                                if ($scope.sObjectName == undefined && field.SObjectId != undefined) {
                                    $scope.sObjectName = field.SObject.name;
                                }
                            }
                            else if (field.mappingType == "Unique Key") {
                                $scope.uniqueKeyMapping.push(field);
                                $scope.uniqueKey = field.sfFieldName;
                                if ($scope.sObjectName == undefined && field.SObjectId != undefined) {
                                    $scope.sObjectName = field.SObject.name;
                                }
                            }
                        });
                        bulkUploadService.getSelectedFields(fieldIDs)
                            .success(function (response) {
                                if (response.success) {
                                    angular.forEach(response.data.sObjectFields, function (field) {
                                        angular.forEach(tempUIFields, function (uifield) {
                                            if (uifield.SObjectField.id == field.ctrlID) {
                                                uifield.ControllerSObjectField = field;
                                            }
                                        });
                                    });
                                }
                                angular.forEach(tempUIFields, function (tuifield) {
                                    $scope.UIField.push(tuifield);
                                });
                            });
                    }
                    else {
                        $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                    }
                    $scope.blockUI.bulkUpload.stop();
                })
                .error(function () {
                    $dialog.alert('Error occured while loading config fields.', 'Error', 'pficon pficon-error-circle-o');
                    $scope.blockUI.bulkUpload.stop();
                });
        };

        $scope.csvToJSON = function (csv) {
            var lines = csv.replace(/\"/g, "").replace(/\r/g, "").split("\n");
            var result = [];
            if (lines.length > 1) {
                var headers = lines[0].split(",");
                for (var i = 1; i < lines.length; i++) {
                    var obj = {};
                    var currentline = lines[i].split(",");
                    for (var j = 0; j < headers.length; j++) {
                        if (currentline[j] === undefined) {
                            currentline[j] = "";
                        }
                    }
                    if (currentline.length > 0) {
                        for (var j = 0; j < headers.length; j++) {
                            if (currentline[j] === "null") {
                                obj[headers[j]] = null;
                            }
                            else {
                                obj[headers[j]] = currentline[j].trim();
                            }
                        }
                        result.push(obj);
                    }
                }
            }
            return result;
        };

        $scope.createRecords = function (records) {
            var newRecords = [];
            var newRecord = {};
            var valid = true;

            angular.forEach(records, function (record) {
                if (valid) {
                    newRecord = {};
                    //Set Default Value
                    angular.forEach($scope.valueMapping, function (valueMappingConfig) {
                        if (valueMappingConfig.defaultValue.indexOf('{LOGGED_IN_USER') > -1) {
                            var userData = JSON.parse($rootScope.user().userdata);
                            if (valueMappingConfig.defaultValue == '{LOGGED_IN_USER}') {
                                newRecord[valueMappingConfig.sfFieldName] = userData.Id;
                            }
                            else {
                                var start = valueMappingConfig.defaultValue.indexOf('{LOGGED_IN_USER') + 16;
                                var stop = valueMappingConfig.defaultValue.indexOf('}', start);
                                var fieldTobeReplaced = valueMappingConfig.defaultValue.substring(start, stop);
                                newRecord[valueMappingConfig.sfFieldName] = userData[valueMappingConfig.defaultValue.replace(valueMappingConfig.defaultValue.substring(start - 16, stop + 1), fieldTobeReplaced)];
                            }
                        }
                        else {
                            newRecord[valueMappingConfig.sfFieldName] = valueMappingConfig.defaultValue;
                        }
                    });
                    //Set Field API, if it is available in Config
                    angular.forEach($scope.fieldMapping, function (fieldMappingConfig) {
                        if ((fieldMappingConfig.datatype == 'date' || fieldMappingConfig.datatype == 'datetime') && record[fieldMappingConfig.csvFieldName] != undefined) {
                            var pattern = /(\d{4})(\d{2})(\d{2})/;
                            var date = new Date(record[fieldMappingConfig.csvFieldName].replace(pattern, '$1-$2-$3'));
                            newRecord[fieldMappingConfig.sfFieldName] = date;
                        }
                        else {
                            if (fieldMappingConfig.csvFieldName != undefined && record[fieldMappingConfig.csvFieldName] != undefined) {
                                newRecord[fieldMappingConfig.sfFieldName] = record[fieldMappingConfig.csvFieldName];
                            }
                        }
                    });
                    //Set Unique Key
                    if ($scope.uniqueKey != undefined) {
                        var uKey = '';
                        angular.forEach($scope.uniqueKeyMapping, function (uniqueKeyMappingConfig) {
                            if (valid) {
                                if (newRecord[uniqueKeyMappingConfig.csvFieldName] == undefined || newRecord[uniqueKeyMappingConfig.csvFieldName] == '') {
                                    $dialog.alert("Unique Key Combination doesn't found from Record.");
                                    valid = false;
                                    newRecords = [];
                                }
                                else {
                                    uKey = uKey + newRecord[uniqueKeyMappingConfig.csvFieldName];
                                }
                            }
                        });
                        if (valid) {
                            newRecord[$scope.uniqueKey] = uKey;
                        }
                    }
                    if (valid) {
                        newRecords.push(newRecord);
                    }
                }
            });
            return newRecords;
        };

        $scope.uploadRecords = function () {
            var name = document.getElementsByName("uploads[]")[0].value;
            if (name.substr(name.length - 4).toLowerCase() != '.csv') {
                $dialog.alert("Please upload valid CSV file");
            } else {
                $scope.upload.filename = name.substr(name.lastIndexOf("\\") + 1);
                var file = $scope.upload.DataFile;
                $scope.upload.DataFile = {};
                $scope.blockUI.bulkUpload.start('Reading file ...');
                $scope.upload.DataFile = $scope.csvToJSON(file);

                if ($scope.upload.DataFile.length > 0) {
                    $scope.blockUI.bulkUpload.stop();
                    $scope.blockUI.bulkUpload.start('Uploading ...');
                    $scope.upload.username = $rootScope.user().username;
                    $scope.upload.records = $scope.createRecords($scope.upload.DataFile);

                    if ($scope.upload.records.length > 0) {
                        var reqData = {};
                        reqData.records = $scope.upload.records;
                        reqData.sObjectName = $scope.sObjectName;
                        bulkUploadService.uploadRecords(reqData)
                            .success(function (response) {
                                $scope.blockUI.bulkUpload.stop();
                                $scope.upload.DataFile = undefined;
                                $scope.upload.records = undefined;
                                if (response.success) {
                                    $dialog.alert(response.message);
                                } else {
                                    $dialog.alert(response.error, 'Error', 'pficon pficon-error-circle-o');
                                }
                            })
                            .error(function (response) {
                                $scope.blockUI.bulkUpload.stop();
                                $dialog.alert('Error occured while uploading records.', 'Error', 'pficon pficon-error-circle-o');
                            });
                    }
                    else {
                        $scope.blockUI.bulkUpload.stop();
                    }
                } else {
                    $scope.blockUI.bulkUpload.stop();
                    $dialog.alert("No records found in file.");
                }
            }
        };

        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                bulkUpload: blockUI.instances.get('bulkUpload')
            };
        };

        $scope.init = function () {
            console.log('csvUploadController loaded!');
            $scope.initBlockUiBlocks();
            $scope.baseCtrl = this;
            $scope.valueMapping = [];
            $scope.fieldMapping = [];
            $scope.UIField = [];
            $scope.uniqueKey = undefined;
            $scope.uniqueKeyMapping = [];
            $scope.sObjectName = undefined;
            $scope.model = {};
            $scope.upload = {
                filename: null,
            };
            $scope.historyRecords = {};
            $scope.getFieldMapping();
        };
        $scope.init();
    }]);