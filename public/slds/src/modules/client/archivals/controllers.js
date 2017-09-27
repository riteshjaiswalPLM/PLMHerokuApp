'use strict';
client.controller('ClientArchivalsController', [
    '$scope', '$rootScope', '$controller', '$state', '$dialog', 'clientArchivalService', '$stateParams',
    function ($scope, $rootScope, $controller, $state, $dialog, clientArchivalService, $stateParams) {

        $scope.loadArchivaltabs = function () {
            clientArchivalService.archivaltabs()

                .success(function (response) {
                    if (response.success) {
                        $scope.archivaltabs = response.archivaltabs;
                    }
                    else {
                        $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                    }
                })
                .error(function (response) {
                    $dialog.alert('Server error occured while loading archivals tabs.', 'Error', 'pficon pficon-error-circle-o');
                });
        };

        $scope.init = function () {
            console.log('ClientArchivalsController loaded!');
            $scope.loadArchivaltabs();
        };
        $scope.init();
    }
]);

client.controller('ClientArchivalController', [
    '$scope', '$rootScope', '$controller', '$state', '$dialog', '$filter', '$timeout', '$appCache', 'blockUI', 'clientArchivalService', '$stateParams',
    function ($scope, $rootScope, $controller, $state, $dialog, $filter, $timeout, $appCache, blockUI, clientArchivalService, $stateParams) {

        $scope.loadLayout = function (LayoutId) {
            if (!$scope.blockUI.reportPageBlock.state().blocking) {
                $scope.blockUI.reportPageBlock.start('Loading Layout Page...');
                clientArchivalService.loadLayout({ LayoutId: LayoutId })
                    .success(function (response) {
                        $scope.blockUI.reportPageBlock.stop();
                        if (response.success) {
                            $scope.reportData = response.sObjectLayouts;
                            $scope.fields = response.fields;
                            $scope.criteriaFields = response.criteriaFields;
                            $scope.resultFields = response.resultFields;
                            $scope.searchResult = [];
                            //$scope.searchResult= undefined,
                            $scope.firstLoad = false;
                            $scope.archivalConfig();
                        }
                        else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }

                    })
                    .error(function (response) {
                        $dialog.alert('Server error occured while loading report tabs.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.reportPageBlock.stop();
                    });
            }
        };
        $scope.archivalConfig = function () {
            if (!$scope.blockUI.reportPageBlock.state().blocking) {
                $scope.blockUI.reportPageBlock.start('Loading Layout Page...');

                clientArchivalService.getConfigdata($scope.reportData)
                    .success(function (response) {
                        if (response.success) {
                            $scope.archivalMetaData = response.data.configData;
                            if ($scope.fields > 0) {
                                $scope.search(1, $scope.pageSize);
                            }
                        }
                        else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.reportPageBlock.stop();
                    }).error(function (response) {
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
                var whereClauseFields = {};
                var validateFields = {};
                angular.forEach($scope.criteriaFields, function (field, index) {
                    if (field.value !== undefined && field.value !== null && field.value !== '') {
                        var fieldType = field.SObjectField.type;
                        if (field.tofield || field.fromfield) {
                            var dataObj = {};
                            if (field.tofield) {
                                if (fieldType === "date" || fieldType === "datetime") {
                                    var dataValue = field.value.getFullYear() + "-" + ("0" + (field.value.getMonth() + 1)).slice(-2) + "-" + ("0" + field.value.getDate()).slice(-2);
                                    dataObj[field.SObjectField.name] = { $lt: dataValue };
                                    if (whereClauseFields[field.SObjectField.name] == undefined) {
                                        whereClauseFields[field.SObjectField.name] = {}
                                    }
                                    whereClauseFields[field.SObjectField.name]["$lt"] = dataValue;
                                    validateFields[field.SObjectField.name + "_tofield"] = field;
                                }
                                else {
                                    dataObj[field.SObjectField.name] = { $lt: field.value };
                                    validateFields[field.SObjectField.name + "_tofield"] = field;
                                    if (whereClauseFields[field.SObjectField.name] == undefined) {
                                        whereClauseFields[field.SObjectField.name] = {}
                                    }
                                    whereClauseFields[field.SObjectField.name]["$lt"] = field.value;
                                }
                            }
                            else {
                                if (fieldType === "date" || fieldType === "datetime") {
                                    var dataValue = field.value.getFullYear() + "-" + ("0" + (field.value.getMonth() + 1)).slice(-2) + "-" + ("0" + field.value.getDate()).slice(-2);
                                    dataObj[field.SObjectField.name] = { $gt: dataValue };
                                    validateFields[field.SObjectField.name + "_fromfield"] = field;
                                    if (whereClauseFields[field.SObjectField.name] == undefined) {
                                        whereClauseFields[field.SObjectField.name] = {}
                                    }
                                    whereClauseFields[field.SObjectField.name]["$gt"] = dataValue;
                                }
                                else {
                                    dataObj[field.SObjectField.name] = { $gt: field.value };
                                    validateFields[field.SObjectField.name + "_fromfield"] = field;
                                    if (whereClauseFields[field.SObjectField.name] == undefined) {
                                        whereClauseFields[field.SObjectField.name] = {}
                                    }
                                    whereClauseFields[field.SObjectField.name]["$gt"] = field.value;
                                }

                            }
                            whereFields['$and'].push(dataObj);
                        } else {
                            if (!(angular.isArray(field.value) && field.value.join(";") === '')) {
                                var data = {};
                                if (field.oldType && field.oldType === "picklist") {
                                    data[field.SObjectField.name] = (angular.isArray(field.value)) ? field.value.join("','") : field.value;
                                    whereClauseFields[field.SObjectField.name] = (angular.isArray(field.value)) ? field.value.join("','") : field.value;
                                }
                                else if (fieldType === "date" || fieldType === "datetime") {
                                    var dataValue = field.value.getFullYear() + "-" + ("0" + (field.value.getMonth() + 1)).slice(-2) + "-" + ("0" + field.value.getDate()).slice(-2);
                                    data[field.SObjectField.name] = dataValue;
                                    whereClauseFields[field.SObjectField.name] = dataValue;
                                }
                                else if (fieldType && fieldType === "string") {
                                    whereClauseFields[field.SObjectField.name] = '%' + field.value + '%';
                                }
                                else {
                                    data[field.SObjectField.name] = (angular.isArray(field.value)) ? field.value.join(';') : field.value;
                                    whereClauseFields[field.SObjectField.name] = (angular.isArray(field.value)) ? field.value.join(';') : field.value;
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
                    LayoutId: $scope.reportData.id,

                    sObject: $scope.reportData.SObject,
                    ArchivalSobjectId: $scope.reportData.ArchivalSobjectId,
                    selectFields: selectFields,
                    whereFields: whereClauseFields,
                    limit: pageSize,

                    page: page
                };

                if (!$scope.blockUI.reportBlock.state().blocking) {
                    $scope.blockUI.reportBlock.start('Loading Report...');
                    var filterparams = [], filtermap = {};
                    angular.forEach($scope.criteriaFields, function (obj, key) {
                        if (angular.isDefined(obj.value) && obj.value != '' && obj.type != 'picklist') {
                            filtermap[obj.name] = '*' + obj.value + '*';
                        } else {
                            filtermap[obj.name] = obj.value;
                        }
                    });
                    clientArchivalService.search(queryObject)
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
        $scope.getFileData = function (file) {
            var req = { file: file };
            var res = { cache: true, responseType: 'arraybuffer' };
            clientArchivalService.getfiledata(req, res)
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
                    clientArchivalService.deletefile(fileObject)
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
        $scope.doAction = function (action, record) {
            $state.go('client.archivaldetail', {
                data: {
                    sobject: $scope.reportData.SObject,
                    recrods: record,
                    archivalMetaData: $scope.archivalMetaData,
                    ArchivalSobjectId: $scope.reportData.ArchivalSobjectId,
                    parentRecord: $scope.reportData.SObject,
                    ArchivalLayoutId: $scope.reportData.id,
                    type: 'Details'
                }
            });

        }
        $scope.init = function () {
            console.log('ClientArchivalController loaded!');
            $scope.firstLoad = true;
            $scope.pageSizes = [10, 25, 50, 100, 200];
            $scope.pageSize = 25;
            $scope.currentPage = 0;
            $scope.stateCache = {};
            $scope.btnExportDis = false;
            $scope.initBlockUiBlocks();
            if ($stateParams && $stateParams.LayoutId) {
                $scope.loadLayout($stateParams.LayoutId);
            }
        };
        var orderBy = $filter('orderBy');

        $scope.init();
    }
]);


client.controller('ClientArchivalDetailLayoutController', [
    '$scope', '$state', '$stateParams', '$dialog', '$adminLookups', 'clientSObjectService', 'blockUI', 'clientArchivalService', '$adminModals', 'ModalService', '$timeout',
    function ($scope, $state, $stateParams, $dialog, $adminLookups, clientSObjectService, blockUI, clientArchivalService, $adminModals, ModalService, $timeout) {
        $scope.sobjectDetaildata = function (layoutId) {
            // Load layout metadata. (For example, layout sections, layout section fields, layout actions etc...)
            if (!$scope.blockUI.layoutBlock.state().blocking && $scope.stateParamMetaData !== undefined) {
                $scope.blockUI.layoutBlock.start('Loading layout...');
                clientArchivalService.sobjectDetaildata($scope.stateParamMetaData)
                    .success(function (response) {
                        $scope.stateParamMetaData['layout'] = response.data.metadata;
                        // $scope.stateParamMetaData['layout']['type']=$scope.stateParamMetaData.type;
                        $scope.blockUI.layoutBlock.stop();
                        if (response.success) {
                            $scope.loadLayoutMetadata(response.data.metadata);
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                    })
                    .error(function (response) {
                        $dialog.alert('Server error occured while loading layout metadata.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.layoutBlock.stop();
                    });
            }
        };

        $scope.loadLayoutMetadata = function () {
            if ($scope.stateParamMetaData !== undefined) {
                $scope.blockUI.layoutBlock.start('Loading layout...');
                clientArchivalService.metadata($scope.stateParamMetaData)
                    .success(function (response) {
                        $scope.blockUI.layoutBlock.stop();
                        if (response.success) {
                            $scope.metadata = response.data.metadata;
                            $scope.archivalConfigSetup = response.data.archivalConfigSetup;
                            var invoiceConfig = {};
                            var relatedListItem = [];
                            var widgetsItem = [];
                            angular.forEach($scope.archivalConfigSetup, function (configs) {
                                if (configs.ObjectName == $scope.stateParamMetaData.sobject.name) {
                                    invoiceConfig = configs;
                                }
                            });
                            angular.forEach($scope.metadata.layoutSections, function (action) {
                                if (action.isComponent === true && action.Component.catagory == "UploadAttachment") {
                                    widgetsItem.push(action);
                                }
                                else if (action.isComponent === false) {
                                    widgetsItem.push(action);
                                }
                            });
                            $scope.metadata.layoutSections = widgetsItem;
                            angular.forEach($scope.metadata.relatedLists, function (action) {
                                angular.forEach($scope.archivalConfigSetup, function (fields) {
                                    if (action.SObject.name === fields.ObjectName && ("," + invoiceConfig.RelatedItemsforDisplay + ",").indexOf("," + fields.Name + ",") != -1) {
                                        relatedListItem.push(action);
                                    }
                                    else if (action.SObject.name.toLowerCase().endsWith("__history") && fields.ArchiveFieldHistory === true
                                        && ((fields.ObjectName.toLowerCase().lastIndexOf("__c") != -1 && action.SObject.name.substring(0, action.SObject.name.toLowerCase().lastIndexOf('__history')) == fields.ObjectName.substring(0, fields.ObjectName.toLowerCase().lastIndexOf("__c")))
                                            || (fields.ObjectName.toLowerCase.lastIndexOf("__c") == -1 && action.SObject.name.substring(0, action.SObject.name.toLowerCase().lastIndexOf('__history')) == fields.ObjectName))) {
                                        relatedListItem.push(action);
                                    }
                                });
                            });

                            $scope.metadata.relatedLists = relatedListItem;
                            $scope.loadSObjectDetails(response.data.metadata);
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                    })
                    .error(function (response) {
                        $dialog.alert('Server error occured while loading layout metadata.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.layoutBlock.stop();
                    });
            }
        };

        $scope.loadsObjectMetadata = function () {
            if ($scope.stateParamMetaData !== undefined) {
                clientArchivalService.sobjectMetadata($scope.stateParamMetaData)
                    .success(function (response) {
                        $scope.sObjectMetaData = response.sObjectDetails;
                    })
                    .error(function (response) {
                        $dialog.alert('Server error occured while loading layout metadata.', 'Error', 'pficon pficon-error-circle-o');
                    });
            }
        };
        $scope.criteriaValidation = function (action, model) {
            if (action.criteria === undefined) {
                return true;
            }
            var criteriaMatched = CriteriaHelper.validate(action.criteria, model);
            if (criteriaMatched) {
                return true;
            } else {
                return false;
            }
        };
        $scope.loadSObjectDetails = function (metadata) {
            $scope.back.allow = true;
            if (!$scope.blockUI.layoutBlock.state().blocking && metadata !== undefined) {
                $scope.blockUI.layoutBlock.start('Loading details...');
                clientArchivalService.details($scope.stateParamMetaData)
                    .success(function (response) {
                        $scope.blockUI.layoutBlock.stop();
                        if (response.success) {
                            $scope.dataModel = response.data.dataModel;
                            $scope.renderRelatedList = true;
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                    })
                    .error(function (response) {
                        $dialog.alert('Server error occured while loading details.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.layoutBlock.stop();
                    });
            }
        };
        $scope.back = {
            allow: false,
            go: function () {
                var stateName = ('client.archival');
                $state.go(stateName, { LayoutId: $scope.stateParamData.ArchivalLayoutId });
            }
        };
        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                layoutBlock: blockUI.instances.get('layoutBlock'),
            };
        };
        $scope.loadLayoutDetail = function () {
            if (!$scope.blockUI.layoutBlock.state().blocking && $scope.stateParamMetaData !== undefined) {
                $scope.blockUI.layoutBlock.start('Loading layout...');
                clientArchivalService.metadata($scope.stateParamMetaData)
                    .success(function (response) {
                        $scope.blockUI.layoutBlock.stop();
                        if (response.success) {
                            $scope.loadSObjectDetails(response.data.metadata);
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                    })
                    .error(function (response) {
                        $dialog.alert('Server error occured while loading layout metadata.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.layoutBlock.stop();
                    });
            }
        };
        $scope.init = function () {
            console.log('ClientArchivalDetailLayoutController loaded!');
            $scope.dataModel = {};
            $scope.renderRelatedList = false;
            $scope.stateParamData = $stateParams.data;
            $scope.stateParamMetaData = $scope.stateParamData;
            $scope.initBlockUiBlocks();
            $scope.sobjectDetaildata();
            $scope.baseCtrl = this;
            $scope.loadsObjectMetadata();
        };
        $scope.init();
    }
]);
