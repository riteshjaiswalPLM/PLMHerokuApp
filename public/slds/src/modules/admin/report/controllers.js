'use strict';

admin.controller('AdminReportsListController', [
    '$scope', '$state', 'reportService', 'blockUI', '$dialog', '$adminLookups',
    function ($scope, $state, reportService, blockUI, $dialog, $adminLookups) {

        $scope.openSObjectReportsLookup = function () {
            $adminLookups.sObjectReport(function (reportsObject) {
                if (!$scope.blockUI.loadReports.state().blocking) {
                    $scope.blockUI.loadReports.start('Creating report for ' + reportsObject.label + '...');
                    reportService.createReport(reportsObject)
                        .success(function (response) {
                            $scope.blockUI.loadReports.stop();
                            if (response.success) {
                                $scope.loadReports();
                            } else {
                                $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                            }
                        })
                        .error(function (response) {
                            $dialog.alert('Error occured while creating report.', 'Error', 'pficon pficon-error-circle-o');
                            $scope.blockUI.loadReports.stop();
                        });
                }
            });
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
            $state.go('admin.reports.edit', { report: report });
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
    '$scope', '$state', '$stateParams', 'reportService', 'sobjectService', 'blockUI', '$dialog', '$adminLookups',
    function ($scope, $state, $stateParams, reportService, sobjectService, blockUI, $dialog, $adminLookups) {

        $scope.loadSObjectFields = function () {
            if (!$scope.blockUI.sObjectFields.state().blocking && $scope.report.SObject != null) {
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
                        }
                        $scope.blockUI.sObjectFields.stop();
                    })
                    .error(function (response) {
                        $dialog.alert('Error occured while loading sobject fields.', 'Error', 'pficon pficon-error-circle-o');
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

        // $scope.components = function () {
        //     if ($scope.componentsValues === undefined) {
        //         $scope.componentsValues = [{
        //             title: 'One Column Section',
        //             deleted: false,
        //             readonly: false,
        //             active: true,
        //             isComponent: false,
        //             SObjectReportId: undefined,
        //             columns: [
        //                 []
        //             ]
        //         }, {
        //             title: 'Two Columns Section',
        //             deleted: false,
        //             readonly: false,
        //             active: true,
        //             isComponent: false,
        //             SObjectReportId: undefined,
        //             columns: [
        //                 [], []
        //             ]
        //         }];
        //     }
        //     return $scope.componentsValues;
        // };

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
            if (!$scope.blockUI.editListReport.state().blocking && $scope.report.SObject != null) {
                $scope.blockUI.editListReport.start('Saving ...');
                reportService.saveReport($scope.searchCriteriaFields, $scope.searchResultFields, $scope.report.id, $scope.report.whereClause)
                    .success(function (response) {
                        $scope.blockUI.editListReport.stop();
                        if (response.success === true) {
                            $scope.loadListReportFields();
                        } else {
                            $dialog.alert('Error occured while saving report.', 'Error', 'pficon pficon-error-circle-o');
                        }
                    })
                    .error(function (response) {
                        $scope.blockUI.editListReport.stop();
                        $dialog.alert('Server error occured while saving report.', 'Error', 'pficon pficon-error-circle-o');
                    });
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
            $scope.report = $stateParams.report;
            $scope.templateUrl = 'slds/views/admin/report/edit.list.html';
            $scope.loadSObjectFields();
            $scope.loadListReportFields();
        };
        $scope.init();

    }]);