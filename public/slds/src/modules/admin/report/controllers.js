'use strict';

admin.controller('AdminReportsListController', [
    '$scope', '$state', 'reportService', 'blockUI', '$dialog',
    function ($scope, $state, reportService, blockUI, $dialog) {

        $scope.createReport = function () {
            if (!$scope.blockUI.loadReports.state().blocking) {
                $scope.blockUI.loadReports.start('Creating report ...');
                reportService.sObjectList()
                    .success(function (response) {
                        $scope.blockUI.loadReports.stop();
                        if (response.success) {
                            $scope.sObjects = response.data.reportsObjectsList;
                            $state.go('admin.reports.edit', { sObjects: response.data.reportsObjectsList, oper: 'Create' });
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                    })
                    .error(function (response) {
                        $dialog.alert('Error occured while creating report.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.loadReports.stop();
                    });
            }
        };

        $scope.loadReports = function () {
            if (!$scope.blockUI.loadReports.state().blocking) {
                $scope.blockUI.loadReports.start('Loading reports...');
                reportService.loadReports()
                    .success(function (response) {
                        if (response.success) {
                            $scope.reports = response.data.reports;
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.loadReports.stop();
                    }).error(function (response) {
                        $dialog.alert('Error occured while loading reports.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.loadReports.stop();
                    });
            }
        };

        $scope.changeActive = function (report) {
            var message = (report.active) ? 'Activating' : 'Deactivating';
            $scope.blockUI.loadReports.start(message + ' "' + report.SObject.label + '" report...');
            reportService.changeActive(report)
                .success(function (response) {
                    if (!response.success) {
                        report.active = !report.active;
                    }
                    $scope.blockUI.loadReports.stop();
                })
                .error(function (response) {
                    $scope.blockUI.loadReports.stop();
                    $dialog.alert('Error occured while ' + message.toLowerCase() + ' report.', 'Error', 'pficon pficon-error-circle-o');
                });
        };

        $scope.deleteReport = function (report) {
            $dialog.confirm({
                title: 'Confirm delete ?',
                yes: 'Yes, Delete', no: 'Cancel',
                message: 'Are you sure to delete report of ' + report.SObject.label + ' ?',
                class: 'destructive',
                headerClass: 'error'
            }, function (confirm) {
                if (confirm) {
                    $scope.blockUI.loadReports.start('Deleting "' + report.SObject.label + '" report...');
                    reportService.deleteReport(report)
                        .success(function (response) {
                            $scope.blockUI.loadReports.stop();
                            if (response.success) {
                                $scope.loadReports();
                            } else {
                                $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                            }
                        })
                        .error(function (response) {
                            $scope.blockUI.loadReports.stop();
                            $dialog.alert('Error occured while deleting report.', 'Error', 'pficon pficon-error-circle-o');
                        });
                }
            });
        };

        $scope.edit = function (report) {
            $state.go('admin.reports.edit', { report: report, oper: 'Edit' });
        };

        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                loadReports: blockUI.instances.get('loadReports')
            };
        };

        $scope.init = function () {
            console.log('AdminReportsListController loaded!');
            $scope.initBlockUiBlocks();
            $scope.loadReports();
        };
        $scope.init();
    }]);

admin.controller('AdminReportsEditController', [
    '$scope', '$state', '$stateParams', 'reportService', 'sobjectService', 'blockUI', '$dialog',
    function ($scope, $state, $stateParams, reportService, sobjectService, blockUI, $dialog) {

        $scope.loadSObjectFields = function (reportSObject) {
            if (reportSObject !== null && reportSObject !== undefined) {
                $scope.report = reportSObject;
            }
            if (!$scope.blockUI.sObjectFields.state().blocking && $scope.report.SObject != null) {
                $scope.sObjectDisabled = true;
                $scope.blockUI.sObjectFields.start('Loading ...');
                sobjectService.loadSObjectFields($scope.report.SObject)
                    .success(function (response) {
                        if (response.success) {
                            $scope.report.SObject.fields = [];
                            $scope.refSObjects = response.data.refSObjects;
                            angular.forEach(response.data.sObjectFields, function (field) {
                                var ControllerSObjectField = undefined;
                                if (field.controllerName && (field.type === 'picklist' || field.type === 'multipicklist')) {
                                    angular.forEach(response.data.sObjectFields, function (ctrlField) {
                                        if (ctrlField.name === field.controllerName) {
                                            ControllerSObjectField = ctrlField;
                                        }
                                    });
                                }
                                var SObjectReportField = {
                                    SObjectField: field,
                                    ControllerSObjectField: ControllerSObjectField,
                                    label: field.label,
                                    type: null,
                                    deleted: false,
                                    recordid: field.type === 'id',
                                    SObjectReportId: $scope.report.id
                                };
                                $scope.report.SObject.fields.push(SObjectReportField);
                            });
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                            $scope.sObjectDisabled = false;
                        }
                        $scope.blockUI.sObjectFields.stop();
                    })
                    .error(function (response) {
                        $dialog.alert('Error occured while loading sobject fields.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.sObjectDisabled = false;
                        $scope.blockUI.sObjectFields.stop();
                    });
            }
        };

        $scope.loadListReportFields = function () {
            if (!$scope.blockUI.editListReport.state().blocking && $scope.report.SObject != null) {
                $scope.blockUI.editListReport.start('Loading ...');
                reportService.loadListReportFields($scope.report)
                    .success(function (response) {
                        if (response.success) {
                            $scope.searchCriteriaFields = [];
                            $scope.searchResultFields = [];
                            angular.forEach(response.data.sObjectReportFields, function (field) {
                                if (field.type === 'Report-Criteria-Field') {
                                    $scope.searchCriteriaFields.push(field);
                                } else {
                                    $scope.searchResultFields.push(field);
                                }
                            });
                        } else {
                            $dialog.alert('Error occured while loading report fields.', 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.editListReport.stop();
                    })
                    .error(function (response) {
                        $dialog.alert('Server error occured while loading report fields.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.editListReport.stop();
                    });
            }
        };

        $scope.returnToList = function () {
            $state.go('admin.reports.list');
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

        $scope.searchCriteriaFieldsDropCallBack = function (event, index, item, external, type, allowedType) {
            if ($scope.isDuplicate($scope.searchCriteriaFields, item)) {
                return false;
            }
            item.type = 'Report-Criteria-Field';
            var rangeAllowedDataTypes = ['date', 'datetime', 'double', 'int'];
            if (rangeAllowedDataTypes.indexOf(item.SObjectField.type) > -1) {
                if (!angular.isDefined(item.tofield) && !angular.isDefined(item.fromfield)) {
                    $dialog.confirm({
                        title: 'Allow to search range?',
                        yes: 'Yes', no: 'No',
                        message: 'Selected field is of type ' + item.SObjectField.type + '. Do you want this field to allow to search in range?\nIf you agree, it will generate to and from field for you.',
                        class: 'brand'
                    }, function (confirm) {
                        if (confirm) {
                            var itemTo = angular.copy(item);
                            if (!itemTo.toField) {
                                itemTo.label = itemTo.label + ' to';
                                itemTo.tofield = true;
                                $scope.searchCriteriaFields.push(itemTo);
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
            if ($scope.isDuplicate($scope.searchResultFields, item)) {
                return false;
            }
            item.type = 'Report-Result-Field';
            return item;
        };

        $scope.removeAndReorder = function (items, item, index) {
            var subRemoveAndReoprder = function (items, item, index) {
                item.deleted = true;
                if (item.id === undefined || item.type == "Report-Criteria-Field" || item.type == "Report-Result-Field") {
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
                            if (i.SObjectField.name === item.SObjectField.name) {
                                toFromPair.push({ item: i, index: _index });
                            }
                        });
                        subRemoveAndReoprder(items, toFromPair[0].item, toFromPair[0].index);
                        subRemoveAndReoprder(items, toFromPair[1].item, toFromPair[1].index);
                    }
                });
            }
            else {
                subRemoveAndReoprder(items, item, index);
            }
        };

        $scope.saveReport = function () {
            if ($scope.report !== undefined && $scope.report !== null) {
                if ($scope.report.reportName === undefined || $scope.report.reportName === null || $scope.report.reportName === "") {
                    $dialog.alert("Please Enter Report Name.");
                    return;
                }
                else if (!(/^[a-zA-Z0-9 ]+$/).test($scope.report.reportName)) {
                    $dialog.alert("Report Name can be Alphanumeric.");
                    return;
                }
                else if ($scope.report.reportName.length > 255) {
                    $dialog.alert("Report Name is too long.");
                    return;
                }
                if ($scope.searchResultFields.length == 0) {
                    $dialog.alert("Please configure at least one field for 'Report Display Fields' section.");
                    return;
                }
                if (!$scope.blockUI.editListReport.state().blocking && $scope.report.SObject != null) {
                    if ($scope.oper == 'Create') {
                        $scope.blockUI.editListReport.start('Saving ...');
                        reportService.createReport($scope.searchCriteriaFields, $scope.searchResultFields, $scope.report, $scope.report.reportName, $scope.report.whereClause)
                            .success(function (response) {
                                $scope.blockUI.editListReport.stop();
                                if (response.success) {
                                    $scope.returnToList();
                                } else {
                                    $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                                }
                            })
                            .error(function (response) {
                                $scope.blockUI.editListReport.stop();
                                $dialog.alert('Server error occured while saving report.', 'Error', 'pficon pficon-error-circle-o');
                            });
                    }
                    else if ($scope.oper == 'Edit') {
                        $scope.blockUI.editListReport.start('Saving ...');
                        reportService.editReport($scope.searchCriteriaFields, $scope.searchResultFields, $scope.report.id, $scope.report.reportName, $scope.report.whereClause)
                            .success(function (response) {
                                $scope.blockUI.editListReport.stop();
                                if (response.success) {
                                    $scope.returnToList();
                                } else {
                                    $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                                }
                            })
                            .error(function (response) {
                                $scope.blockUI.editListReport.stop();
                                $dialog.alert('Server error occured while saving report.', 'Error', 'pficon pficon-error-circle-o');
                            });
                    }
                }
            }
        };

        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                sObjectFields: blockUI.instances.get('sObjectFields'),
                editListReport: blockUI.instances.get('editListReport')
            };
        };

        $scope.init = function () {
            console.log('AdminReportsEditController loaded!');
            $scope.initBlockUiBlocks();
            $scope.sObjects = $stateParams.sObjects;
            $scope.report = $stateParams.report;
            $scope.oper = $stateParams.oper;
            $scope.templateUrl = 'slds/views/admin/report/edit.list.html';
            $scope.searchCriteriaFields = [];
            $scope.searchResultFields = [];
            $scope.sObjectDisabled = false;
            if ($scope.report !== null && $scope.report !== undefined) {
                $scope.loadSObjectFields();
                $scope.loadListReportFields();
            }
        };
        $scope.init();

    }]);