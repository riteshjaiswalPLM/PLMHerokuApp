'use strict';

client.controller('CSVUploadController', [
    '$scope', '$rootScope', '$http', 'CSVUploadConfigService', 'bulkUploadService', 'blockUI', '$dialog',
    function ($scope, $rootScope, $http, CSVUploadConfigService, bulkUploadService, blockUI, $dialog) {

        $scope.getFieldMapping = function () {
            $scope.blockUI.bulkUpload.start('Loading ...');
            CSVUploadConfigService.getFieldMapping()
                .success(function (response) {
                    if (response.success) {
                        var fieldIDs = [];
                        var tempUIFields = [];
                        angular.forEach(response.data.mappedFields, function (field) {
                            if ($scope.config.helpDocURL == undefined || $scope.config.helpDocURL == '') {
                                $scope.config.helpDocURL = field.helpDocURL;
                            }
                            if ($scope.config.templateURL == undefined || $scope.config.templateURL == '') {
                                $scope.config.templateURL = field.templateURL;
                            }
                            if (field.mappingType == "Value Mapping") {
                                $scope.valueMapping.push(field);
                                $scope.model[field.sfFieldName] = field.defaultValue;
                                if ($scope.sObject == undefined && field.SObjectId != undefined) {
                                    $scope.sObject = field.SObject;
                                }
                            }
                            else if (field.mappingType == "Field Mapping") {
                                $scope.fieldMapping.push(field);
                                if ($scope.sObject == undefined && field.SObjectId != undefined) {
                                    $scope.sObject = field.SObject;
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
                                if (newField.datatype == "picklist") {
                                    angular.forEach(newField.SObjectField.picklistValues, function (picklistValue, index) {
                                        if (picklistValue.value == "Individual Payment Request") {
                                            newField.SObjectField.picklistValues.splice(index, 1);
                                        }
                                    });
                                }
                                tempUIFields.push(newField);
                                if ($scope.sObject == undefined && field.SObjectId != undefined) {
                                    $scope.sObject = field.SObject;
                                }
                            }
                            else if (field.mappingType == "Unique Key") {
                                $scope.uniqueKeyMapping.push(field);
                                $scope.uniqueKey = field.sfFieldName;
                                if ($scope.sObject == undefined && field.SObjectId != undefined) {
                                    $scope.sObject = field.SObject;
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

        $scope.getUploadHistory = function () {
            $scope.blockUI.bulkUpload.start('Loading ...');
            bulkUploadService.getUploadHistory()
                .success(function (response) {
                    $scope.blockUI.bulkUpload.stop();
                    if (response.success) {
                        $scope.historyRecords = response.data.historyRecords;
                    }
                    else {
                        $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                    }
                })
                .error(function (response) {
                    $scope.blockUI.bulkUpload.stop();
                    $dialog.alert('Error occured while loading upload history.', 'Error', 'pficon pficon-error-circle-o');
                });
        };

        $scope.getFile = function (id) {
            bulkUploadService.getFile({ id: id })
                .success(function (response) {
                    if (response.success) {
                        $scope.getFileData(response.data.record.Body, response.data.record.Name);
                    }
                    else {
                        $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                    }
                })
                .error(function (response) {
                    $dialog.alert('Error occured while downloading file.', 'Error', 'pficon pficon-error-circle-o');
                });
        };

        $scope.getFileData = function (body, name) {
            var attachmentData = {
                name: name,
                body: body
            }
            $scope.blockUI.bulkUpload.start('Loading file...');
            $http.post("/api/service/component/getfiledata", attachmentData, { cache: true, responseType: 'arraybuffer' })
                .success(function (response, status, headers, config) {
                    $scope.blockUI.bulkUpload.stop();
                    var objectUrl = URL.createObjectURL(new Blob([response], { type: headers()['content-type'] }));
                    if (navigator.appVersion.toString().indexOf('.NET') > 0 || navigator.userAgent.toString().indexOf('MSIE') != -1) { // for IE browser
                        window.navigator.msSaveBlob(new Blob([response], { type: headers()['content-type'] }), decodeURI(name));
                    } else { // for other browsers
                        var a = $("<a style='display: none;'/>");
                        a.attr("href", objectUrl);
                        a.attr("download", decodeURI(name));
                        $("body").append(a);
                        a[0].click();
                        // window.URL.revokeObjectURL(objectUrl);
                        a.remove();
                    }
                })
                .error(function () {
                    $scope.blockUI.bulkUpload.stop()
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
                        var isBlankline = true;
                        for (var j = 0; j < headers.length; j++) {
                            if (currentline[j] === "null") {
                                obj[headers[j]] = null;
                            }
                            else {
                                obj[headers[j]] = currentline[j].trim();
                                if (currentline[j].trim() != "") {
                                    isBlankline = false;
                                }
                            }
                        }
                        if (!isBlankline) {
                            result.push(obj);
                        }
                    }
                }
            }
            return result;
        };

        $scope.validateFile = function (record) {
            var valid = true;
            var fieldList = "";
            //Set Field API, if it is available in Config
            angular.forEach($scope.fieldMapping, function (fieldMappingConfig) {
                if (fieldMappingConfig.csvFieldName != undefined && record[fieldMappingConfig.csvFieldName] == undefined) {
                    fieldList += fieldMappingConfig.csvFieldName + ", ";
                    document.getElementsByName("uploads[]")[0].value = '';
                    valid = false;
                }
            });
            if (!valid) {
                $dialog.alert(fieldList.substring(0, fieldList.length - 2) + " Field is missing in CSV.");
            }
            //Set UI Field API, if UI Field value available from UI
            angular.forEach($scope.UIField, function (UIFieldConfig) {
                if (valid && (UIFieldConfig.value == undefined || UIFieldConfig.value == null || UIFieldConfig.value == '')) {
                    $dialog.alert("Please Enter value for Field " + UIFieldConfig.label + ".");
                    document.getElementsByName("uploads[]")[0].value = '';
                    valid = false;
                }
            });
            return valid;
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
                    //Set UI Field API, if UI Field value available from UI
                    angular.forEach($scope.UIField, function (UIFieldConfig) {
                        if (UIFieldConfig.value != undefined && UIFieldConfig.value != null && UIFieldConfig.value != '') {
                            newRecord[UIFieldConfig.sfFieldName] = UIFieldConfig.value;
                        }
                    });
                    //Set Unique Key
                    if ($scope.uniqueKey != undefined) {
                        var uKey = '';
                        angular.forEach($scope.uniqueKeyMapping, function (uniqueKeyMappingConfig) {
                            if (valid) {
                                if (newRecord[uniqueKeyMappingConfig.csvFieldName] == undefined || newRecord[uniqueKeyMappingConfig.csvFieldName] == '') {
                                    $dialog.alert("Unique Key Combination doesn't found from Record.");
                                    document.getElementsByName("uploads[]")[0].value = '';
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
                document.getElementsByName("uploads[]")[0].value = '';
            } else {
                $scope.upload.filename = name.substr(name.lastIndexOf("\\") + 1);
                var file = $scope.upload.DataFile;
                $scope.upload.DataFile = {};
                $scope.blockUI.bulkUpload.start('Reading file ...');
                $scope.upload.DataFile = $scope.csvToJSON(file);

                if ($scope.upload.DataFile.length > 0) {
                    $scope.blockUI.bulkUpload.stop();
                    $scope.blockUI.bulkUpload.start('Uploading ...');
                    if ($scope.validateFile($scope.upload.DataFile[0])) {
                        $scope.upload.records = $scope.createRecords($scope.upload.DataFile);

                        if ($scope.upload.records.length > 0) {
                            var reqData = {};
                            reqData.records = $scope.upload.records;
                            reqData.sObjectName = $scope.sObject.name;
                            reqData.filename = $scope.upload.filename;
                            bulkUploadService.uploadRecords(reqData)
                                .success(function (response) {
                                    $scope.blockUI.bulkUpload.stop();
                                    $scope.upload.DataFile = undefined;
                                    $scope.upload.records = undefined;
                                    if (response.success) {
                                        $dialog.alert(response.message);
                                        $scope.getUploadHistory();
                                    } else {
                                        $dialog.alert(response.error, 'Error', 'pficon pficon-error-circle-o');
                                        document.getElementsByName("uploads[]")[0].value = '';
                                    }
                                })
                                .error(function (response) {
                                    $scope.blockUI.bulkUpload.stop();
                                    $dialog.alert('Error occured while uploading records.', 'Error', 'pficon pficon-error-circle-o');
                                    document.getElementsByName("uploads[]")[0].value = '';
                                });
                        }
                        else {
                            $scope.blockUI.bulkUpload.stop();
                        }
                    }
                    else {
                        $scope.blockUI.bulkUpload.stop();
                    }
                } else {
                    $scope.blockUI.bulkUpload.stop();
                    $dialog.alert("No records found in file.");
                    document.getElementsByName("uploads[]")[0].value = '';
                }
            }
        };

        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                bulkUpload: blockUI.instances.get('bulkUpload')
            };
        };

        $scope.init = function () {
            console.log('CSVUploadController loaded!');
            $scope.initBlockUiBlocks();
            $scope.baseCtrl = this;
            $scope.valueMapping = [];
            $scope.fieldMapping = [];
            $scope.UIField = [];
            $scope.uniqueKey = undefined;
            $scope.uniqueKeyMapping = [];
            $scope.sObject = undefined;
            $scope.model = {};
            $scope.upload = {
                filename: null,
                username: ($rootScope.user().firstname || $rootScope.user().lastname) ? (($rootScope.user().firstname ? $rootScope.user().firstname : '') + ' ' + ($rootScope.user().lastname ? $rootScope.user().lastname : '')) : $rootScope.user().username
            };
            $scope.config = {
                helpDocURL: '',
                templateURL: ''
            }
            $scope.historyRecords = {};
            $scope.getFieldMapping();
            $scope.getUploadHistory();
        };
        $scope.init();
    }]);