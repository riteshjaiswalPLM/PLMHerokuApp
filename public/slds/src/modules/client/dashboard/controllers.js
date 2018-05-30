client.controller('ClientDashboardController', [
    '$scope', '$rootScope', '$state', '$stateParams', 'DashboardService', '$dialog', 'blockUI', '$filter', '$appCache', 'CriteriaHelper', '$clientLookups',
    function ($scope, $rootScope, $state, $stateParams, DashboardService, $dialog, blockUI, $filter, $appCache, CriteriaHelper, $clientLookups) {
        var orderBy = $filter('orderBy');
        $scope.getDashboardComponentMetadata = function () {
            if (!$scope.blockUI.ClientDashboardBlockUI.state().blocking) {
                if ($scope.stateCache === undefined) {
                    $scope.stateCache = {
                        containersMetadata: undefined,
                        searchResult: {},
                        orderByField: undefined
                    };
                }
                else {
                    $scope.stateCache = $appCache.get($state.current.name);
                    if ($scope.stateCache.btnClick === "save" && $scope.stateCache.cacheReference !== undefined && $scope.stateCache.recordReference !== undefined) {
                        $scope.loadData($scope.stateCache.configuration,$scope.stateCache.catagory+ 'Component' + $scope.stateCache.componentId,$scope.stateCache.catagory+ $scope.stateCache.componentId + 'Block' ,$scope.stateCache.label, $scope.stateCache.allowedType, true);
                        $scope.searchResult = $scope.stateCache.searchResult;
                        $appCache.put($state.current.name, $scope.stateCache);
                    }
                }
                if ($scope.stateCache.containersMetaData === undefined) {
                    $scope.blockUI.ClientDashboardBlockUI.start('Loading dashboard metadata...');
                    DashboardService.getDashboardComponentMetadata()
                        .success(function (response) {
                            $scope.blockUI.ClientDashboardBlockUI.stop();
                            if (response.success) {
                                $scope.containersMetaData = response.data.containerMetadata;
                                $scope.stateCache.containersMetaData = $scope.containersMetaData;
                                $appCache.put($state.current.name, $scope.stateCache);
                            }
                            else {
                                $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                            }
                        })
                        .error(function () {
                            $scope.blockUI.ClientDashboardBlockUI.stop();
                            $dialog.alert('Server error occured while loading dashboard metadata.', 'Error', 'pficon pficon-error-circle-o');
                        });
                }
                else {
                    $scope.containersMetaData = $scope.stateCache.containersMetaData;
                    $scope.searchResult = $scope.stateCache.searchResult;
                }
            }
        };

        $scope.openAttachment = function(id){
            // _newWindow=window.open("api/salesforce/getAttachmentFile?id="+id,"_blank",'width=400,height=400')
            // _newWindow.document.title = "My New Title";
            var url= "api/salesforce/getAttachmentFile?id="+id
            var title="My New Title"
            var w=window.innerWidth/2;
            var h=window.innerHeight-100;
            // Fixes dual-screen position                         Most browsers      Firefox
            var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
            var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

            var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
            var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

            var left = ((width / 2) - (w / 2)) + dualScreenLeft;
            var top = ((height / 2) - (h / 2)) + dualScreenTop;
            var newWindow = window.open(url, title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
            newWindow.document.title = "Document"
            // Puts focus on the newWindow
            if (window.focus) {
                newWindow.focus();
            }
		};
        $scope.applyOrderBy = function (field, records) {
            if ($scope.searchResult[records] && $scope.searchResult[records].length > 0) {
                $scope.predicate = field.SObjectField.name;
                $scope.reverse = ($scope.predicate === field.SObjectField.name) ? !$scope.reverse : false;
                $scope.searchResult[records] = orderBy($scope.searchResult[records], field.SObjectField.name, $scope.reverse);

                $scope.stateCache.orderByField = field;
                $appCache.put($state.current.name, $scope.stateCache);
            }
        };
        $scope.refresh = function () {
            $appCache.remove($state.current.name);
            $scope.init();
        };
        $scope.doAction = function (stateCacheName, action, record, recordActions, relativeField,configuration,catagory,componentId,label,allowedType) {
            $scope.stateCache = $appCache.get($state.current.name);
            $scope.stateCache.cacheReference = stateCacheName;
            $scope.stateCache.recordReference = record;
            $appCache.put($state.current.name, $scope.stateCache);
            $scope.stateCache.configuration = configuration;
            $scope.stateCache.catagory  = catagory;
            $scope.stateCache.componentId  = componentId;
            $scope.stateCache.label  = label;
            $scope.stateCache.allowedType = allowedType;
            var _editAction = undefined;
            if (relativeField) {
                record.Id = record[relativeField.name];
                record.attributes = record[relativeField.relationshipName].attributes;
            }
            if (recordActions.length > 1) {
                angular.forEach(recordActions, function (action) {
                    if (action.label === 'Edit' && !_editAction) {
                        _editAction = action;
                    }
                });
            }
            try {
                $state.go(action.state, {
                    data: {
                        record: record,
                        editAction: _editAction,
                        isFromDashboard: true
                    }
                });
            } catch (e) {
                $dialog.alert('It seems like there is some configuration issue.\nPlease contact your admin.', 'Error', 'pficon pficon-error-circle-o');
            }
        };
        $scope.doDefaultAction = function (record, recordActions) {
            if (recordActions) {
                var _action = undefined;
                var _editAction = undefined;
                if (recordActions.length === 1) {
                    if (recordActions[0].label === 'Edit' && $scope.criteriaValidation(recordActions[0], record)) {
                        _action = recordActions[0];
                    }
                    else if (recordActions[0].label !== 'Edit'  && $scope.criteriaValidation(recordActions[0], record)) {
                        _action = recordActions[0];
                    }

                } else {
                    angular.forEach(recordActions, function (action) {
                        if (action.label === 'Details' && !_action && $scope.criteriaValidation(action, record)) {
                            _action = action;
                        } else if (action.label === 'Edit' && $scope.criteriaValidation(action, record) && !_editAction) {
                            _editAction = action;
                        }
                    });
                }
                if (_action) {
                    try {
                        $state.go(_action.state, {
                            data: {
                                record: record,
                                editAction: _editAction
                            }
                        });
                    } catch (e) {
                        $dialog.alert('It seems like there is some configuration issue.\nPlease contact your admin.', 'Error', 'pficon pficon-error-circle-o');
                    }
                }
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
        $scope.loadData = function (configuration, records, blockId, componentTitle, componentType, refreshFlag) {
            if ($scope.stateCache.searchResult[records] === undefined || refreshFlag === true) {
                var payload = {
                    config: configuration,
                    type: componentType
                };
                var blockui = blockUI.instances.get(blockId);
                blockui.start("Loading " + componentTitle + "...");
                DashboardService.loadData(payload)
                    .success(function (response) {
                        blockui.stop();
                        if (response.success) {
                            $scope.searchResult[records] = response.data.records;
                            $scope.stateCache.searchResult = $scope.searchResult;
                            $appCache.put($state.current.name, $scope.stateCache);
                        }
                        else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                    })
                    .error(function () {
                        blockui.stop();
                        $dialog.alert('Server error occured while loading ' + componentTitle + ' data.', 'Error', 'pficon pficon-error-circle-o');
                    });
            }
            else {
                $scope.searchResult[records] = $scope.stateCache.searchResult[records];
            }

        };
        $scope.exportData = function (configuration, componentType, label) {
            var payload = {
                config: configuration,
                type: componentType
            };

            $scope.btnExportDis = true;
            DashboardService.exportData(payload)
                .success(function (response) {
                    if (response.success) {
                        if (response.data != undefined) {
                            $scope.getFileData(response.data.file, label);
                        }
                        else {
                            $dialog.alert("No records found.");
                        }
                    }
                    else {
                        $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                    }
                    $scope.btnExportDis = false
                })
                .error(function () {
                    $dialog.alert('Server error occured while querying data.', 'Error', 'pficon pficon-error-circle-o');
                    $scope.btnExportDis = false;
                });
        };
        $scope.getFileData = function (file, label) {
            var req = { file: file };
            var res = { cache: true, responseType: 'arraybuffer' };
            DashboardService.getfiledata(req, res)
                .success(function (response, status, headers, config) {
                    var objectUrl = URL.createObjectURL(new Blob([response], { type: headers()['content-type'] }));
                    if (navigator.appVersion.toString().indexOf('.NET') > 0 || navigator.userAgent.toString().indexOf('MSIE') != -1) { // for IE browser
                        window.navigator.msSaveBlob(new Blob([response], { type: headers()['content-type'] }), label + ".xlsx");
                    } else { // for other browsers
                        var a = $("<a style='display: none;'/>");
                        a.attr("href", objectUrl);
                        a.attr("download", label + ".xlsx");
                        $("body").append(a);
                        a[0].click();
                        a.remove();
                    }

                    //Delete file from server
                    var fileObject = {
                        file: file
                    };
                    DashboardService.deletefile(fileObject)
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
                ClientDashboardBlockUI: blockUI.instances.get('ClientDashboardBlockUI'),
            };
        };
        $scope.showHideContainers = function (container, containers) {
            var isCollapse = container.isCollapse ? false : true;
            if (isCollapse) {
                angular.forEach(containers, function (datacontainer) {
                    datacontainer.isCollapse = false;
                });
            }
            container.isCollapse = isCollapse;
        };
        $scope.showHideComponent = function (container, component) {
            var isCollapse = component.isCollapse ? false : true;
            if (isCollapse) {
                angular.forEach(container.DashboardContainersComponents, function (containersComponent) {
                    containersComponent.isCollapse = false;
                });
            }
            component.isCollapse = isCollapse;
        };

        $scope.syncRefSObjectsFields = function (sObjectFields) {
            var dependentSObjectfieldsNames = $scope.dependentSObjectsFields(sObjectFields);
            var sObjectsToSync = [];
            $scope.blockUI.sObjectActions.start('Preparing ...');
            angular.forEach($scope.result, function (sfdcSObjFields) {
                if (dependentSObjectfieldsNames.indexOf(sfdcSObjFields.name) !== -1) {
                    sObjectsToSync.push(angular.copy(sfdcSObjFields));
                }
            });
            $scope.blockUI.sObjectActions.stop();
            $scope.currentSObjectIndex = 0;
            var stopSync = $scope.$watch(function () {
                return $scope.currentSObjectIndex;
            }, function (newValue, oldValue) {
                if (newValue === 0 || newValue === (oldValue + 1)) {
                    if (newValue === sObjectsToSync.length) {
                        stopSync();
                        $scope.loadSObjectFields();
                    } else {
                        $scope.newSObjectField(sObjectsToSync[newValue], function () {
                            $scope.currentSObjectIndex++;
                        });
                    }
                }
            });
            $scope.data.InvoiceApproveFieldSelectAll = false;
        };
        $scope.callInvoiceApproveFieldSelectAll = function (sAllChkId, sObjectFields) {
            var cnt = 0;
            if (sAllChkId) {
                angular.forEach(sObjectFields, function (sObjField) {
                    if (cnt < 30) {
                        sObjField.isChecked = true;
                    }
                    cnt++;
                });
                if (cnt > 30) {
                    $dialog.alert("Maximum 30 record allow at time for multi-approve process");
                }
                return;
            }
            else {
                angular.forEach(sObjectFields, function (sObjField) {
                    sObjField.isChecked = false;
                });
            }
        }
        $scope.syncObjFieldCheckbox = function (sAllChkId, sObjectFields, field) {
            var currentState = field;
            console.log(currentState);
            var isAllChecked = true;
            angular.forEach(sObjectFields, function (sObjField) {
                if (!sObjField.isChecked) {
                    isAllChecked = false;
                }
            });
            $scope.data[sAllChkId] = isAllChecked;
        }
        $scope.bulkOperationLookup = function (configuration, allowedType, sAllChkId, sObjectFields, component) {
            var isField = undefined;
            var isChecked = false;
            var isCheckedField = '';
            var cnt = 0;
            isChecked = $scope.data[sAllChkId];
            {
                angular.forEach(sObjectFields, function (sObjField) {
                    if (sObjField.isChecked) {
                        cnt++;
                        if (isField == undefined) {
                            if (configuration.detailSobjectname != null && configuration.detailSobjectname != undefined) {
                                isField = sObjField[configuration.relativeField.relationshipName];
                            }
                            else {
                                isField = sObjField;
                            }
                        }
                        isChecked = true;
                        if (configuration.detailSobjectname != null && configuration.detailSobjectname != undefined) {
                            isCheckedField += sObjField[configuration.relativeField.name] + ",";
                        }
                        else {
                            isCheckedField += sObjField.Id + ",";
                        }
                    }
                });
            }
            if (cnt > 30) {
                $dialog.alert("Maximum 30 records are allowed at a time for bulk approval process.");
                return;
            }
            if (isChecked) {
                if (cnt == 0) {
                    $dialog.alert("Please select at least one record");
                }
                if (cnt > 0) {
                    $clientLookups.bulk({ data: configuration.multipleFields, model: isField, sObjectName: configuration.name, detailSobjectName: configuration.detailSobjectname, dataModel: isCheckedField,bulkOperationTitle:configuration.bulkOperationTitle }, function () {
                        $scope.loadData(component.Component.ComponentDetail.configuration, component.Component.catagory + 'Component' + component.id, component.Component.catagory + component.id + 'Block', component.label, allowedType, true);
                        $scope.data.InvoiceApproveFieldSelectAll = false;
                    });
                }
            }
            else {
                $dialog.alert("Please select at least one record");
            }
        };
        $scope.init = function () {
            console.log('ClientDashboardController loaded!');
            $scope.initBlockUiBlocks();
            $scope.icon = $stateParams.icon;
            $scope.showRefreshResult = $stateParams.showRefreshResult;
            $scope.searchResult = {};
            $scope.stateCache = $appCache.get($state.current.name)
            $scope.getDashboardComponentMetadata();
            $scope.btnExportDis = false;
            $scope.data = {
                InvoiceApproveFieldSelectAll: false

            };
        };
        $scope.init();
    }
]);