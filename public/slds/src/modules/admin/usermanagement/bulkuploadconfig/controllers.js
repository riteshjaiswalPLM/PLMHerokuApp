'use strict';

admin.controller('AdminUserManageBulkUploadConfigController', [
    '$scope', '$rootScope', '$state', 'userConfigService', 'blockUI', '$dialog',
    function ($scope, $rootScope, $state, userConfigService, blockUI, $dialog) {

        $scope.getuserfields = function () {
            if (!$scope.blockUI.sfdcUserFields.state().blocking) {
                $scope.blockUI.sfdcUserFields.start('Loading ...');
                userConfigService.getuserfields()
                    .success(function (response) {
                        if (response.success) {
                            $scope.usersObjectFields = response.data.usersObjectFields;
                            $scope.refSObjects = response.data.refSObjects;
                            angular.forEach($scope.usersObjectFields, function (field) {
                                if (field.type == "reference") {
                                    field.SObjectField = angular.copy(field);
                                }
                            });
                            $scope.getmappedfields();
                        }
                        else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.sfdcUserFields.stop();
                    })
                    .error(function () {
                        $dialog.alert('Error occured while loading user config fields.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.sfdcUserFields.stop();
                    });
            }
        };

        $scope.getmappedfields = function () {
            if (!$scope.blockUI.existingMapping.state().blocking) {
                $scope.blockUI.existingMapping.start('Loading ...');
                userConfigService.getmappedfields()
                    .success(function (response) {
                        if (response.success) {
                            $scope.section.columns[0] = response.data.mappedFields;
                            angular.forEach($scope.section.columns[0], function (field) {
                                field.type = field.datatype;
                                delete field.datatype;
                                field.name = field.sfFieldName;
                                delete field.sfFieldName;
                                field.subtype = 'User-Mapping-Field';
                                field.columns = 1;

                                angular.forEach($scope.usersObjectFields, function (_field) {
                                    if (field.name == _field.name) {
                                        field.id = _field.id;
                                        field.nillable = _field.nillable;
                                        field.deleted = false;
                                    }
                                });

                                if (field.type == "reference") {
                                    angular.forEach($scope.usersObjectFields, function (_field) {
                                        if (field.name == _field.name) {
                                            field.SObjectField = angular.copy(_field);
                                        }
                                    });
                                    //field.SObjectField = angular.copy(field);
                                    field.relationshipName = field.referenceTableName;
                                    delete field.referenceTableName;
                                    field.reference = field.referenceFieldName;
                                    delete field.referenceFieldName;
                                    field.refSObjects = {};
                                }

                                field.csvfieldddformat = '-1';
                                field.csvfieldmmformat = '-1';
                                field.csvfieldyyformat = '-1';
                                field.csvfielddatesep = '-1';
                                field.csvfieldtimeformat = '-1';
                                field.csvFieldFormat = field.datatypeFormat;

                                if (field.type == 'datetime') {
                                    field.csvfieldtimeformat = field.datatypeFormat.substring(field.datatypeFormat.lastIndexOf(" ") + 1);
                                    field.datatypeFormat = field.datatypeFormat.substring(0, field.datatypeFormat.lastIndexOf(" "));

                                    if (field.datatypeFormat.indexOf('-') != -1) {
                                        field.csvfielddatesep = '-';
                                        field.csvfieldddformat = field.datatypeFormat.substring(0, field.datatypeFormat.indexOf("-"));
                                        field.csvfieldmmformat = field.datatypeFormat.substring(field.datatypeFormat.indexOf("-") + 1, field.datatypeFormat.lastIndexOf("-"));
                                        field.csvfieldyyformat = field.datatypeFormat.substring(field.datatypeFormat.lastIndexOf("-") + 1);
                                    }
                                    else if (field.datatypeFormat.indexOf('/') != -1) {
                                        field.csvfielddatesep = '/';
                                        field.csvfieldddformat = field.datatypeFormat.substring(0, field.datatypeFormat.indexOf("/"));
                                        field.csvfieldmmformat = field.datatypeFormat.substring(field.datatypeFormat.indexOf("/") + 1, field.datatypeFormat.lastIndexOf("/"));
                                        field.csvfieldyyformat = field.datatypeFormat.substring(field.datatypeFormat.lastIndexOf("/") + 1);
                                    }
                                    else if (field.datatypeFormat.indexOf(' ') != -1) {
                                        field.csvfielddatesep = 'space';
                                        field.csvfieldddformat = field.datatypeFormat.substring(0, field.datatypeFormat.indexOf(" "));
                                        field.csvfieldmmformat = field.datatypeFormat.substring(field.datatypeFormat.indexOf(" ") + 1, field.datatypeFormat.lastIndexOf(" "));
                                        field.csvfieldyyformat = field.datatypeFormat.substring(field.datatypeFormat.lastIndexOf(" ") + 1);
                                    }
                                }
                                if (field.type == 'date') {
                                    if (field.datatypeFormat.indexOf('-') != -1) {
                                        field.csvfielddatesep = '-';
                                        field.csvfieldddformat = field.datatypeFormat.substring(0, field.datatypeFormat.indexOf("-"));
                                        field.csvfieldmmformat = field.datatypeFormat.substring(field.datatypeFormat.indexOf("-") + 1, field.datatypeFormat.lastIndexOf("-"));
                                        field.csvfieldyyformat = field.datatypeFormat.substring(field.datatypeFormat.lastIndexOf("-") + 1);
                                    }
                                    else if (field.datatypeFormat.indexOf('/') != -1) {
                                        field.csvfielddatesep = '-';
                                        field.csvfieldddformat = field.datatypeFormat.substring(0, field.datatypeFormat.indexOf("/"));
                                        field.csvfieldmmformat = field.datatypeFormat.substring(field.datatypeFormat.indexOf("/") + 1, field.datatypeFormat.lastIndexOf("/"));
                                        field.csvfieldyyformat = field.datatypeFormat.substring(field.datatypeFormat.lastIndexOf("/") + 1);
                                    }
                                    else if (field.datatypeFormat.indexOf(' ') != -1) {
                                        field.csvfielddatesep = '-';
                                        field.csvfieldddformat = field.datatypeFormat.substring(0, field.datatypeFormat.indexOf(" "));
                                        field.csvfieldmmformat = field.datatypeFormat.substring(field.datatypeFormat.indexOf(" ") + 1, field.datatypeFormat.lastIndexOf(" "));
                                        field.csvfieldyyformat = field.datatypeFormat.substring(field.datatypeFormat.lastIndexOf(" ") + 1);
                                    }
                                }
                            });

                            angular.forEach($scope.section.columns[0], function (field, fieldOrder) {
                                field.order = fieldOrder;
                            });
                        }
                        else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.existingMapping.stop();
                    })
                    .error(function () {
                        $dialog.alert('Error occured while loading user config fields.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.existingMapping.stop();
                    });
            }
        };

        $scope.fieldsDropCallBack = function (event, index, item, external, type, section, columnNumber) {
            var sectionFields = section.columns[0];

            if ($scope.isDuplicate(sectionFields, item)) {
                return false;
            }

            item.subtype = 'User-Mapping-Field';
            item.columns = columnNumber;
            item.order = index;
            item.isUsernameField = false;
            item.fileFieldName = '';
            item.csvfieldddformat = '-1';
            item.csvfieldmmformat = '-1';
            item.csvfieldyyformat = '-1';
            item.csvfielddatesep = '-1';
            item.csvfieldtimeformat = '-1';
            item.csvFieldFormat = item.csvfieldddformat + item.csvfielddatesep + item.csvfieldmmformat + item.csvfielddatesep + item.csvfieldyyformat + item.csvfieldtimeformat;

            angular.forEach(section.columns, function (fields) {
                angular.forEach(fields, function (field, fieldOrder) {
                    field.order = fieldOrder;
                });
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
            if (item.id === undefined || item.subtype == "User-Mapping-Field") {
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
        };

        $scope.syncUserRadio = function (thisfield) {
            var fields = $scope.section.columns[0];
            // if (fields.length == 1) {
            //     if (thisfield.isUsernameField) {
            //         thisfield.isUsernameField = false;
            //     }
            //     else {
            //         thisfield.isUsernameField = true;
            //     }
            // }
            // else {
            angular.forEach(fields, function (field) {
                field.isUsernameField = false;
            });
            thisfield.isUsernameField = true;
            //}
        };

        $scope.saveuserconfig = function () {
            var configs = $scope.section.columns[0];
            var isValid = true;
            var isUsernameFieldConfigured = false;
            angular.forEach(configs, function (config) {
                if (config.isUsernameField) {
                    isUsernameFieldConfigured = true;
                }
                config.csvFieldFormat = config.csvfieldddformat + config.csvfielddatesep + config.csvfieldmmformat + config.csvfielddatesep + config.csvfieldyyformat;
                if (config.type == 'datetime') {
                    config.csvFieldFormat = config.csvFieldFormat + " " + config.csvfieldtimeformat;
                }
                if (config.fileFieldName == '' && isValid) {
                    $dialog.alert("Please enter CSV field name for '" + config.label + "' field.");
                    isValid = false;
                }
                if ((config.type == 'datetime' || config.type == 'date') && isValid) {
                    if (config.csvFieldFormat.indexOf('-1') != -1) {
                        $dialog.alert("Please enter date and/or time format for '" + config.label + "' field.");
                        isValid = false;
                    }
                    else {
                        var dd = 0, mm = 0, yy = 0;
                        if (config.csvfieldddformat == 'DD') {
                            dd = 0;
                        } else if (config.csvfieldddformat == 'MM') {
                            dd = 1;
                        } else if (config.csvfieldddformat == 'YY' || config.csvfieldddformat == 'YYYY') {
                            dd = 2;
                        }
                        if (config.csvfieldmmformat == 'DD') {
                            mm = 0;
                        } else if (config.csvfieldmmformat == 'MM') {
                            mm = 1;
                        } else if (config.csvfieldmmformat == 'YY' || config.csvfieldmmformat == 'YYYY') {
                            mm = 2;
                        }
                        if (config.csvfieldyyformat == 'DD') {
                            yy = 0;
                        } else if (config.csvfieldyyformat == 'MM') {
                            yy = 1;
                        } else if (config.csvfieldyyformat == 'YY' || config.csvfieldyyformat == 'YYYY') {
                            yy = 2;
                        }

                        if (dd == mm || dd == yy || mm == yy) {
                            $dialog.alert("Please enter valid date format for '" + config.label + "' field.");
                            isValid = false;
                        }
                    }
                }
            });

            if (isValid && configs.length > 0) {
                if (!isUsernameFieldConfigured) {
                    $dialog.alert("Please select Unique field.");
                }
                else {
                    if (!$scope.blockUI.userFieldsMapping.state().blocking && $scope.section.columns[0].length > 0) {
                        $scope.blockUI.userFieldsMapping.start('Loading ...');
                        userConfigService.saveuserconfig($scope.section.columns[0])
                            .success(function (response) {
                                if (response.success) {
                                    $dialog.alert("User field mappings saved successfully.");
                                    $scope.init();
                                }
                                else {
                                    $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                                }
                                $scope.blockUI.userFieldsMapping.stop();
                            })
                            .error(function () {
                                $dialog.alert('Error occured while saving user field mappings.', 'Error', 'pficon pficon-error-circle-o');
                                $scope.blockUI.userFieldsMapping.stop();
                            });
                    }
                }
            }
        };

        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                sfdcUserFields: blockUI.instances.get('sfdcUserFields'),
                existingMapping: blockUI.instances.get('existingMapping'),
                userFieldsMapping: blockUI.instances.get('userFieldsMapping')
            };
        };

        $scope.init = function () {
            console.log('AdminUserManageBulkUploadConfigController loaded!');
            $scope.sidePanel = 'slds/views/admin/usermanagement/bulkuploadconfig/sidepanel.html';
            $scope.dropZone = 'slds/views/admin/usermanagement/bulkuploadconfig/dropzone.html';
            $scope.initBlockUiBlocks();
            $scope.getuserfields();
            //$scope.getmappedfields();
            $scope.usersObjectFields = [];
            $scope.section = {};
            $scope.section.columns = [[]];
        };
        $scope.init();
    }]);