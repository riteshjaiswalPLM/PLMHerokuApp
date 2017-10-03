'use strict';

client.controller('ClientReportsController', [
    '$scope', '$rootScope', '$controller', '$state', '$dialog', 'clientReportService',
    function ($scope, $rootScope, $controller, $state, $dialog, clientReportService) {

        $scope.loadReportTabs = function () {
            clientReportService.reporttabs()
                .success(function (response) {
                    if (response.success) {
                        $scope.reporttabs = response.reporttabs;
                    }
                    else {
                        $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                    }
                })
                .error(function (response) {
                    $dialog.alert('Server error occured while loading report tabs.', 'Error', 'pficon pficon-error-circle-o');
                });
        };

        $scope.init = function () {
            console.log('ClientReportsController loaded!');
            $scope.loadReportTabs();
        };
        $scope.init();
    }
]);

client.controller('ClientReportController', [
    '$scope', '$rootScope', '$controller', '$state', '$dialog', '$timeout', '$filter', '$appCache', 'blockUI', 'clientReportService',
    function ($scope, $rootScope, $controller, $state, $dialog, $timeout, $filter, $appCache, blockUI, clientReportService) {

        $scope.loadReport = function (reportid) {
            if (!$scope.blockUI.reportPageBlock.state().blocking) {
                $scope.blockUI.reportPageBlock.start('Loading Report Page...');
                clientReportService.loadReport({ reportid: reportid })
                    .success(function (response) {
                        if (response.success) {
                            $scope.reportData = response.report;
                            $scope.fields = response.fields;
                            $scope.criteriaFields = response.criteriaFields;
                            $scope.resultFields = response.resultFields;
                            $scope.searchResult = [];
                            $scope.firstLoad = false;
                            if ($scope.fields > 0) {
                                $scope.search(1, $scope.pageSize);
                            }
                        }
                        else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.reportPageBlock.stop();
                    })
                    .error(function (response) {
                        $dialog.alert('Server error occured while loading report tabs.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.reportPageBlock.stop();
                    });
            }
        };

        $scope.search = function (page, pageSize) {
            $scope.pageSize = pageSize;

            if ($scope.reportData.SObject !== undefined) {
                var selectFields = [];
                angular.forEach($scope.resultFields, function (field, index) {
                    selectFields.push(field);
                });

                var whereFields = {};
                whereFields['$and'] = [];
                var validateFields = {};
                angular.forEach($scope.criteriaFields, function (field, index) {
                    if (field.value !== undefined && field.value !== null && field.value !== '') {
                        var fieldType = field.SObjectField.type;
                        if (field.tofield || field.fromfield) {
                            var dataObj = {};
                            if (field.tofield) {
                                if (fieldType === "date" || fieldType === "datetime") {
                                    var dataValue = field.value.getFullYear() + "-" + ("0" + (field.value.getMonth() + 1)).slice(-2) + "-" + ("0" + field.value.getDate()).slice(-2);
                                    dataObj[field.SObjectField.name] = { $lt: dataValue, type: field.SObjectField.type };
                                    validateFields[field.SObjectField.name + "_tofield"] = field;
                                }
                                else {
                                    dataObj[field.SObjectField.name] = { $lt: field.value, type: field.SObjectField.type };
                                    validateFields[field.SObjectField.name + "_tofield"] = field;
                                }
                            }
                            else {
                                if (fieldType === "date" || fieldType === "datetime") {
                                    var dataValue = field.value.getFullYear() + "-" + ("0" + (field.value.getMonth() + 1)).slice(-2) + "-" + ("0" + field.value.getDate()).slice(-2);
                                    dataObj[field.SObjectField.name] = { $gt: dataValue, type: field.SObjectField.type };
                                    validateFields[field.SObjectField.name + "_fromfield"] = field;
                                }
                                else {
                                    dataObj[field.SObjectField.name] = { $gt: field.value, type: field.SObjectField.type };
                                    validateFields[field.SObjectField.name + "_fromfield"] = field;
                                }

                            }
                            whereFields['$and'].push(dataObj);
                        } else {
                            if (!(angular.isArray(field.value) && field.value.join(";") === '')) {
                                var data = {};
                                if (field.oldType && field.oldType === "picklist") {
                                    data[field.SObjectField.name] = { value: (angular.isArray(field.value)) ? field.value.join("','") : field.value, fieldtype: field.oldType };
                                }
                                else if (fieldType === "date" || fieldType === "datetime") {
                                    var dataValue = field.value.getFullYear() + "-" + ("0" + (field.value.getMonth() + 1)).slice(-2) + "-" + ("0" + field.value.getDate()).slice(-2);
                                    data[field.SObjectField.name] = { value: dataValue, fieldtype: field.oldType };
                                }
                                else {
                                    data[field.SObjectField.name] = { value: (angular.isArray(field.value)) ? field.value.join(';') : field.value, fieldtype: field.SObjectField.type };
                                }
                                whereFields['$and'].push(data);
                            }
                        }
                    }
                });

                var validationMessage = "";
                var tofieldData = undefined;
                angular.forEach(validateFields, function (field, key) {
                    if (field.fromfield) {
                        tofieldData = validateFields[field.SObjectField.name + "_tofield"];
                        if (tofieldData && field.value > tofieldData.value) {
                            validationMessage += "\"" + tofieldData.label + "\"  should be greater than \"" + field.label + "\". <br>";
                        }
                    }
                });
                if (validationMessage !== "") {
                    $dialog.alert(validationMessage, 'Validation Alert', 'pficon-warning-triangle-o');
                    return;
                }
                var queryObject = {
                    reportId: $scope.reportData.id,
                    sObject: $scope.reportData.SObject,
                    selectFields: selectFields,
                    whereFields: whereFields,
                    limit: pageSize,
                    page: page
                };

                if (!$scope.blockUI.reportBlock.state().blocking) {
                    $scope.blockUI.reportBlock.start('Loading Report...');
                    clientReportService.search(queryObject)
                        .success(function (response) {
                            if (response.success) {
                                $scope.searchResult = response.data.searchResult;
                                $scope.currentPage = response.data.currentPage;
                                $scope.hasMore = response.data.hasMore;

                                $scope.stateCache.searchResult = $scope.searchResult;
                                $scope.stateCache.currentPage = $scope.currentPage;
                                $scope.stateCache.pageSize = pageSize;
                                $scope.stateCache.hasMore = $scope.hasMore;
                                $appCache.put($state.current.name, $scope.stateCache);
                            } else {
                                $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                            }
                            $scope.blockUI.reportBlock.stop();
                        })
                        .error(function (response) {
                            $dialog.alert('Server error occured while querying data.', 'Error', 'pficon pficon-error-circle-o');
                            $scope.blockUI.reportBlock.stop();
                        });
                }
            }
        };

        $scope.reset = function () {
            angular.forEach($scope.criteriaFields, function (field, index) {
                field.value = "";
                if (field.SObjectField.type === "reference") {
                    field.labelValue = "";
                }
            });
            $timeout(function () {
                $scope.search(1, $scope.pageSize);
            }, 100);
        };

        $scope.applyOrderBy = function (field) {
            if ($scope.searchResult && $scope.searchResult.length > 0) {
                $scope.predicate = field.SObjectField.name;
                $scope.reverse = ($scope.predicate === field.SObjectField.name) ? !$scope.reverse : false;
                $scope.searchResult = orderBy($scope.searchResult, field.SObjectField.name, $scope.reverse);

                $scope.stateCache.orderByField = field;
                $appCache.put($state.current.name, $scope.stateCache);
            }
        };

        $scope.exportToExcel = function () {
            if ($scope.reportData.SObject !== undefined) {
                var selectFields = [];
                angular.forEach($scope.resultFields, function (field, index) {
                    selectFields.push(field);
                });

                var whereFields = {};
                whereFields['$and'] = [];
                var validateFields = {};
                angular.forEach($scope.criteriaFields, function (field, index) {
                    if (field.value !== undefined && field.value !== null && field.value !== '') {
                        var fieldType = field.SObjectField.type;
                        if (field.tofield || field.fromfield) {
                            var dataObj = {};
                            if (field.tofield) {
                                if (fieldType === "date" || fieldType === "datetime") {
                                    var dataValue = field.value.getFullYear() + "-" + ("0" + (field.value.getMonth() + 1)).slice(-2) + "-" + ("0" + field.value.getDate()).slice(-2);
                                    dataObj[field.SObjectField.name] = { $lt: dataValue, type: field.SObjectField.type };
                                    validateFields[field.SObjectField.name + "_tofield"] = field;
                                }
                                else {
                                    dataObj[field.SObjectField.name] = { $lt: field.value, type: field.SObjectField.type };
                                    validateFields[field.SObjectField.name + "_tofield"] = field;
                                }
                            }
                            else {
                                if (fieldType === "date" || fieldType === "datetime") {
                                    var dataValue = field.value.getFullYear() + "-" + ("0" + (field.value.getMonth() + 1)).slice(-2) + "-" + ("0" + field.value.getDate()).slice(-2);
                                    dataObj[field.SObjectField.name] = { $gt: dataValue, type: field.SObjectField.type };
                                    validateFields[field.SObjectField.name + "_fromfield"] = field;
                                }
                                else {
                                    dataObj[field.SObjectField.name] = { $gt: field.value, type: field.SObjectField.type };
                                    validateFields[field.SObjectField.name + "_fromfield"] = field;
                                }

                            }
                            whereFields['$and'].push(dataObj);
                        } else {
                            if (!(angular.isArray(field.value) && field.value.join(";") === '')) {
                                var data = {};
                                if (field.oldType && field.oldType === "picklist") {
                                    data[field.SObjectField.name] = { value: (angular.isArray(field.value)) ? field.value.join("','") : field.value, fieldtype: field.oldType };
                                }
                                else if (fieldType === "date" || fieldType === "datetime") {
                                    var dataValue = field.value.getFullYear() + "-" + ("0" + (field.value.getMonth() + 1)).slice(-2) + "-" + ("0" + field.value.getDate()).slice(-2);
                                    data[field.SObjectField.name] = { value: dataValue, fieldtype: field.oldType };
                                }
                                else {
                                    data[field.SObjectField.name] = { value: (angular.isArray(field.value)) ? field.value.join(';') : field.value, fieldtype: field.SObjectField.type };
                                }
                                whereFields['$and'].push(data);
                            }
                        }
                    }
                });

                var validationMessage = "";
                var tofieldData = undefined;
                angular.forEach(validateFields, function (field, key) {
                    if (field.fromfield) {
                        tofieldData = validateFields[field.SObjectField.name + "_tofield"];
                        if (tofieldData && field.value > tofieldData.value) {
                            validationMessage += "\"" + tofieldData.label + "\"  should be greater than \"" + field.label + "\". <br>";
                        }
                    }
                });
                if (validationMessage !== "") {
                    $dialog.alert(validationMessage, 'Validation Alert', 'pficon-warning-triangle-o');
                    return;
                }
                var queryObject = {
                    reportId: $scope.reportData.id,
                    sObject: $scope.reportData.SObject,
                    selectFields: selectFields,
                    whereFields: whereFields
                };

                $scope.btnExportDis = true;
                clientReportService.export(queryObject)
                    .success(function (response) {
                        if (response.success) {
                            if (response.data != undefined) {
                                $scope.getFileData(response.data.file);
                            }
                            else {
                                $dialog.alert("No records found.");
                            }
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.btnExportDis = false;
                    })
                    .error(function (response) {
                        $dialog.alert('Server error occured while querying data.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.btnExportDis = false;
                    });
            }
        };

        $scope.getFileData = function (file) {
            var req = { file: file };
            var res = { cache: true, responseType: 'arraybuffer' };
            clientReportService.getfiledata(req, res)
                .success(function (response, status, headers, config) {
                    var objectUrl = URL.createObjectURL(new Blob([response], { type: headers()['content-type'] }));
                    if (navigator.appVersion.toString().indexOf('.NET') > 0 || navigator.userAgent.toString().indexOf('MSIE') != -1) { // for IE browser
                        window.navigator.msSaveBlob(new Blob([response], { type: headers()['content-type'] }), $scope.reportData.SObject.label + " Report.xlsx");
                    } else { // for other browsers
                        var a = $("<a style='display: none;'/>");
                        a.attr("href", objectUrl);
                        a.attr("download", $scope.reportData.SObject.label + " Report.xlsx");
                        $("body").append(a);
                        a[0].click();
                        a.remove();
                    }

                    //Delete file from server
                    var fileObject = {
                        file: file
                    };
                    clientReportService.deletefile(fileObject)
                        .success(function () {
                        })
                        .error(function () {
                        });
                }).error(function () {
                    $dialog.alert('Server error occured while downloading file.', 'Error', 'pficon pficon-error-circle-o');
                });
        };

        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                reportPageBlock: blockUI.instances.get('reportPageBlock'),
                reportBlock: blockUI.instances.get('reportBlock')
            };
        };

        $scope.init = function () {
            console.log('ClientReportController loaded!');
            $scope.firstLoad = true;
            $scope.pageSizes = [10, 25, 50, 100, 200];
            $scope.pageSize = 25;
            $scope.currentPage = 0;
            $scope.stateCache = {};
            $scope.btnExportDis = false;
            $scope.initBlockUiBlocks();
        };
        var orderBy = $filter('orderBy');

        $scope.init();
    }
]);