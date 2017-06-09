'use strict';

client.controller('ClientLayoutController',[
            '$scope','$rootScope','$state','$stateParams',
    function($scope , $rootScope , $state , $stateParams){
        $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
            if($scope.stateParamMetaData !== null && toState.name === $scope.defaultState && fromState !== $scope.stateParamMetaData.redirectTo){
                event.preventDefault();
                $state.go($scope.stateParamMetaData.redirectTo);
            }
        });
        $scope.init = function(){
            console.log('ClientLayoutController loaded!');
            $scope.stateParamMetaData = $stateParams.metadata;
            $scope.defaultState = $state.current.name;
            $scope.icon=$state.current.tab?$state.current.tab.icon:'';
            if($scope.stateParamMetaData !== null && $scope.stateParamMetaData.redirectTo !== undefined){
                $state.go($scope.stateParamMetaData.redirectTo);
            }
        };
        $scope.init();
    }
]);

client.controller('ClientListLayoutController',[
            '$scope','$rootScope','$state','$stateParams','$dialog','$timeout','$filter','$appCache','blockUI','clientLayoutService','clientSObjectService','CriteriaHelper',
    function($scope , $rootScope , $state , $stateParams , $dialog , $timeout , $filter , $appCache , blockUI , clientLayoutService , clientSObjectService,CriteriaHelper){
        var orderBy = $filter('orderBy');
        $scope.loadLayoutMetadata = function(){
            if($scope.stateCache === undefined){
                $scope.stateCache = {
                    metadata: undefined,
                    searchResult: undefined,
                    currentPage: 1,
                    pageSize: 25,
                    hasMore: false,
                    orderByField: undefined,
                };
            }
            if($scope.stateCache.metadata === undefined){
                // Load layout metadata. (For example, search criteria fields, search result fields for table etc...)
                if(!$scope.blockUI.layoutMetadataBlock.state().blocking && $scope.stateParamMetaData !== undefined){
                    $scope.blockUI.layoutMetadataBlock.start('Loading layout...');
                    clientLayoutService.metadata($scope.stateParamMetaData)
                        .success(function(response){
                            $scope.blockUI.layoutMetadataBlock.stop();
                            if(response.success){
                                // $scope.metadata = response.data.metadata;
                                $scope.searchCriteriaFields = [];
                                $scope.searchResultFields = [];
                                $scope.recordActions = response.data.metadata.recordactions;
                                $scope.navBarActions = response.data.metadata.navbaractions;

                                angular.forEach($scope.recordActions,function(action){
                                    angular.forEach(response.data.metadata.btnCriteria,function(btncriteria){
                                        if(action.label===btncriteria.keyName){
                                            action.criteria=btncriteria.criteria;
                                        }
                                    });
                                });

                                angular.forEach(response.data.metadata.fields,function(field){
                                    if(field.type === 'Search-Criteria-Field'){
                                        $scope.searchCriteriaFields.push(field);
                                    }else{
                                        $scope.searchResultFields.push(field);
                                    }
                                });
                                
                                $scope.stateCache.metadata = {
                                    searchCriteriaFields: $scope.searchCriteriaFields,
                                    searchResultFields: $scope.searchResultFields,
                                    recordActions: $scope.recordActions,
                                    navBarActions: $scope.navBarActions
                                }
                                $appCache.put($state.current.name, $scope.stateCache);
                                
                                $timeout(function(){
                                    $scope.search(1, $scope.pageSize);
                                },100);
                            }else{
                                $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                            }
                        })
                        .error(function(response){
                            $dialog.alert('Server error occured while loading layout metadata.','Error','pficon pficon-error-circle-o');
                            $scope.blockUI.layoutMetadataBlock.stop();
                        });
                }
            }else{
                var metadata = $scope.stateCache.metadata;
                $scope.searchCriteriaFields = metadata.searchCriteriaFields;
                $scope.searchResultFields = metadata.searchResultFields;
                $scope.recordActions = metadata.recordActions;
                $scope.navBarActions = metadata.navBarActions;
                
                if($scope.stateCache.searchResult === undefined || $scope.stateCache.btnClick === "save"){
                    $timeout(function(){
                        $scope.search(1, $scope.pageSize);
                    },100);
                }else{
                    $scope.searchResult = $scope.stateCache.searchResult;
                    $scope.currentPage = $scope.stateCache.currentPage;
                    $scope.pageSize = $scope.stateCache.pageSize;
                    if($scope.stateCache.orderByField){
                        $scope.applyOrderBy($scope.stateCache.orderByField);
                    }
                }
            }
            
        };
        $scope.reset = function(){
            angular.forEach($scope.searchCriteriaFields,function(field,index){
               field.value="";
               if(field.SObjectField.type==="reference"){
                   field.labelValue="";
               }
            });
            $timeout(function(){
                $scope.search(1, $scope.pageSize);
            },100);
        };
        $scope.search = function(page,pageSize){
            $scope.pageSize=pageSize;
            if(!$scope.blockUI.searchResultBlock.state().blocking && $scope.stateParamMetaData !== undefined){
                var selectFields = [];
                angular.forEach($scope.searchResultFields,function(field,index){
                    selectFields.push(field);
                });
                var found=false;
                angular.forEach($scope.recordActions,function(action,index){
                    if(action.criteria !== undefined ){
                        angular.forEach(CriteriaHelper.fieldList(action.criteria),function(field,index){
                            if(field.SObjectField.type==="reference"){
                                field.reference = (field.reference) ? field.reference : 'Name';
                            }
                            selectFields.push(field);
                        });
                    }
                });
                
                var whereFields = {};
                whereFields['$and']=[];
                var validateFields={};
                angular.forEach($scope.searchCriteriaFields,function(field,index){
                    if(field.value !== undefined && field.value !== null && field.value !== ''){
                        var fieldType=field.SObjectField.type;
                        if(field.tofield || field.fromfield){
                            var dataObj = {};
                            if(field.tofield){
                                if(fieldType === "date" || fieldType === "datetime"){
                                    var dataValue=field.value.getFullYear()+"-"+("0"+(field.value.getMonth()+1)).slice(-2)+"-"+("0"+field.value.getDate()).slice(-2);
                                    dataObj[field.SObjectField.name] = {$lt: dataValue, type: field.SObjectField.type};
                                    validateFields[field.SObjectField.name+"_tofield"]=field;
                                }
                                else{
                                    dataObj[field.SObjectField.name] = {$lt: field.value, type: field.SObjectField.type};
                                    validateFields[field.SObjectField.name+"_tofield"]=field;
                                }
                            }
                            else{
                                if(fieldType === "date" || fieldType === "datetime"){
                                    var dataValue=field.value.getFullYear()+"-"+("0"+(field.value.getMonth()+1)).slice(-2)+"-"+("0"+field.value.getDate()).slice(-2);
                                    dataObj[field.SObjectField.name] = {$gt: dataValue, type: field.SObjectField.type};
                                    validateFields[field.SObjectField.name+"_fromfield"]=field;
                                }
                                else{
                                    dataObj[field.SObjectField.name] = {$gt: field.value, type: field.SObjectField.type};
                                    validateFields[field.SObjectField.name+"_fromfield"]=field;
                                }

                            }
                            whereFields['$and'].push(dataObj);
                        }else{
                            if(!(angular.isArray(field.value) && field.value.join(";") === '')){
                                var data = {};
                                if(field.oldType && field.oldType === "picklist"){
                                    data[field.SObjectField.name] = {value : (angular.isArray(field.value)) ? field.value.join("','") : field.value, fieldtype : field.oldType};
                                }
                                else if(fieldType === "date" || fieldType === "datetime"){
                                    var dataValue=field.value.getFullYear()+"-"+("0"+(field.value.getMonth()+1)).slice(-2)+"-"+("0"+field.value.getDate()).slice(-2);
                                    data[field.SObjectField.name] = {value : dataValue, fieldtype : field.oldType};
                                }
                                else{
                                    data[field.SObjectField.name] = {value : (angular.isArray(field.value)) ? field.value.join(';') : field.value, fieldtype : field.SObjectField.type};    
                                }
                                whereFields['$and'].push(data);
                            }
                        }
                    }
                });
                var validationMessage="";
                var tofieldData=undefined;
                angular.forEach(validateFields,function(field,key){
                    if(field.fromfield){
                        tofieldData=validateFields[field.SObjectField.name+"_tofield"];
                        if(tofieldData && field.value > tofieldData.value){
                            validationMessage+="\""+tofieldData.label +"\"  should be greater than \""+field.label+"\". <br>";
                        }
                    }
                });
                if(validationMessage !== ""){
                    $dialog.alert(validationMessage,'Validation Alert','pficon-warning-triangle-o');
                    return;
                }
                var queryObject = {
                    sObject: $scope.stateParamMetaData.sobject,
                    selectFields: selectFields,
                    whereFields: whereFields,
                    limit: pageSize,
                    page: page 
                };
                
                $scope.blockUI.searchResultBlock.start('Searching ...');
                clientSObjectService.search(queryObject)
                    .success(function(response){
                        if(response.success){
                            $scope.searchResult = response.data.searchResult;
                            $scope.currentPage = response.data.currentPage;
                            $scope.hasMore = response.data.hasMore;
                            
                            $scope.stateCache.searchResult = $scope.searchResult;
                            $scope.stateCache.currentPage = $scope.currentPage;
                            $scope.stateCache.pageSize = pageSize;
                            $scope.stateCache.hasMore = $scope.hasMore;
                            $appCache.put($state.current.name, $scope.stateCache);
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.searchResultBlock.stop();
                    })
                    .error(function(response){
                        $dialog.alert('Server error occured while querying data.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.searchResultBlock.stop();
                    });
            }
        };
        $scope.exportToExcel = function () {
            if ($scope.stateParamMetaData !== undefined) {
                var selectFields = [];
                angular.forEach($scope.searchResultFields, function (field, index) {
                    selectFields.push(field);
                });

                var whereFields = {};
                whereFields['$and'] = [];
                var validateFields = {};
                angular.forEach($scope.searchCriteriaFields, function (field, index) {
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
                    sObject: $scope.stateParamMetaData.sobject,
                    selectFields: selectFields,
                    whereFields: whereFields
                };

                $scope.btnExportDis = true;
                clientSObjectService.export(queryObject)
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
            clientSObjectService.getfiledata(req, res)
                .success(function (response, status, headers, config) {
                    var objectUrl = URL.createObjectURL(new Blob([response], { type: headers()['content-type'] }));
                    if (navigator.appVersion.toString().indexOf('.NET') > 0 || navigator.userAgent.toString().indexOf('MSIE') != -1) { // for IE browser
                        window.navigator.msSaveBlob(new Blob([response], { type: headers()['content-type'] }), $rootScope.title() + ".xlsx");
                    } else { // for other browsers
                        var a = $("<a style='display: none;'/>");
                        a.attr("href", objectUrl);
                        a.attr("download", $rootScope.title() + ".xlsx");
                        $("body").append(a);
                        a[0].click();
                        a.remove();
                    }

                    //Delete file from server
                    var fileObject = {
                        file: file
                    };
                    clientSObjectService.deletefile(fileObject)
                        .success(function () {
                        })
                        .error(function () {
                        });
                }).error(function () {
                    $dialog.alert('Server error occured while downloading file.', 'Error', 'pficon pficon-error-circle-o');
                });
        };
        $scope.applyOrderBy = function(field){
            if($scope.searchResult && $scope.searchResult.length > 0){
                $scope.predicate = field.SObjectField.name;
                $scope.reverse = ($scope.predicate === field.SObjectField.name) ? !$scope.reverse : false;
                $scope.searchResult = orderBy($scope.searchResult, field.SObjectField.name, $scope.reverse);
                
                $scope.stateCache.orderByField = field;
                $appCache.put($state.current.name, $scope.stateCache);
            }
        };
        $scope.criteriaValidation = function(action,model){
            if(action.criteria === undefined){
                return true;
            }
            var criteriaMatched = CriteriaHelper.validate(action.criteria,model);
            if(criteriaMatched){
                return true;
            }else{
                return false;
            }
        };
        $scope.doAction = function(action, record){
            if(action.type === 'navbar'){
                $state.go(action.state);
                // $dialog.alert(JSON.stringify(action));
            }else{
                var _editAction = undefined;
                if($scope.recordActions.length > 1){
                    angular.forEach($scope.recordActions,function(action){
                        if(action.label === 'Edit' && !_editAction){
                            _editAction = action;
                        }
                    });
                }
                $state.go(action.state, {
                    data: {
                        record: record,
                        editAction: _editAction
                    }
                });
            }
        };
        $scope.doDefaultAction = function(record){
            if($scope.recordActions){
                var _action = undefined;
                var _editAction = undefined;
                if($scope.recordActions.length === 1){
                    if($scope.recordActions[0].label === 'Edit' && $scope.criteriaValidation($scope.recordActions[0],record)){
                        _action = $scope.recordActions[0];
                    }
                    else if($scope.recordActions[0].label !== 'Edit' ){
                        _action = $scope.recordActions[0];
                    }
                    
                }else{
                    angular.forEach($scope.recordActions,function(action){
                        if(action.label === 'Details' && !_action){
                            _action = action;
                        }else if(action.label === 'Edit' && $scope.criteriaValidation(action,record) && !_editAction){
                            _editAction = action;
                        }
                    });
                }
                if(_action){
                    $state.go(_action.state, {
                        data: {
                            record: record,
                            editAction: _editAction 
                        }
                    });
                }
            }  
        };
        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                layoutMetadataBlock: blockUI.instances.get('layoutMetadataBlock'),
                searchResultBlock: blockUI.instances.get('searchResultBlock')
            };
        };
        $scope.init = function(){
            $scope.pageSizes = [10,25,50,100,200];
            $scope.pageSize = 25;
            $scope.currentPage = 0;
            $scope.stateCache = $appCache.get($state.current.name);
            console.log('ClientListLayoutController loaded!');
            $scope.stateParamMetaData = $state.current.params.metadata;
            $scope.initBlockUiBlocks();
            $scope.loadLayoutMetadata();
            $scope.btnExportDis = false;
        };
        $scope.init();
    }
]);

client.controller('ClientCreateLayoutController',[
            '$scope','$rootScope','$state','$stateParams','$dialog','$timeout','$filter','$controller','blockUI','clientLayoutService','clientSObjectService',
    function($scope , $rootScope , $state , $stateParams , $dialog , $timeout , $filter , $controller , blockUI , clientLayoutService , clientSObjectService){
        $scope.init = function(){
            console.info('ClientCreateLayoutController loaded!');
            angular.extend(this, $controller('ClientSectionLayoutController',{ $scope: $scope}));
        }
        $scope.init();
    }
]);
client.controller('ClientEditLayoutController',[
            '$scope','$rootScope','$state','$stateParams','$dialog','$timeout','$filter','$controller','blockUI','clientLayoutService','clientSObjectService',
    function($scope , $rootScope , $state , $stateParams , $dialog , $timeout , $filter , $controller , blockUI , clientLayoutService , clientSObjectService){
        $scope.init = function(){
            console.info('ClientEditLayoutController loaded!');
            angular.extend(this, $controller('ClientSectionLayoutController',{ $scope: $scope}));
        }
        $scope.init();
    }
]);
client.controller('ClientDetailsLayoutController',[
            '$scope','$rootScope','$state','$stateParams','$dialog','$timeout','$filter','$controller','blockUI','clientLayoutService','clientSObjectService',
    function($scope , $rootScope , $state , $stateParams , $dialog , $timeout , $filter , $controller , blockUI , clientLayoutService , clientSObjectService){
        $scope.edit = function(){
            if($scope.stateParamData !== undefined && $scope.stateParamData.editAction !== undefined){
                var state = $scope.stateParamData.editAction.state;
                $state.go(state, {data: $scope.stateParamData});
            }
        };
        $scope.init = function(){
            console.info('ClientDetailsLayoutController loaded!');
            angular.extend(this, $controller('ClientSectionLayoutController',{ $scope: $scope}));
        }
        $scope.init();
    }
]);

// client.controller('ClientEditLayoutController',[
client.controller('ClientSectionLayoutController',[
            '$scope','$rootScope','$state','$stateParams','$dialog','$controller','$appCache','$timeout','$filter','blockUI','clientLayoutService','clientSObjectService','CriteriaHelper',
    function($scope , $rootScope , $state , $stateParams , $dialog , $controller ,$appCache, $timeout , $filter , blockUI , clientLayoutService , clientSObjectService,CriteriaHelper){
        var orderBy = $filter('orderBy');
        $scope.loadLayoutMetadata = function(){
            // Load layout metadata. (For example, layout sections, layout section fields, layout actions etc...)
            if(!$scope.blockUI.layoutBlock.state().blocking && $scope.stateParamMetaData !== undefined){
                $scope.blockUI.layoutBlock.start('Loading layout...');
                clientLayoutService.metadata($scope.stateParamMetaData)
                    .success(function(response){
                        $scope.blockUI.layoutBlock.stop();
                        if(response.success){
                            // $scope.metadata = response.data.metadata;
                            $timeout(function(){
                                $scope.loadSObjectDetails(response.data.metadata);
                            },0);
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                    })
                    .error(function(response){
                        $dialog.alert('Server error occured while loading layout metadata.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.layoutBlock.stop();
                    });
            }
        };
        $scope.loadsObjectMetadata = function(){
            // Load sobject metadata. 
            if($scope.stateParamMetaData !== undefined ){
                clientLayoutService.sobjectMetadata($scope.stateParamMetaData)
                    .success(function(response){
                        $scope.sObjectMetaData=response.sObjectDetails;
                    })
                    .error(function(response){
                        $dialog.alert('Server error occured while loading layout metadata.','Error','pficon pficon-error-circle-o');
                    });
            }
            
        };
        $scope.criteriaValidation = function(action,model){
            if(action.criteria === undefined){
                return true;
            }
            var criteriaMatched = CriteriaHelper.validate(action.criteria,model);
            if(criteriaMatched){
                return true;
            }else{
                return false;
            }
        };
        $scope.loadSObjectDetails = function(metadata){
            if($scope.stateParamData === undefined || $scope.stateParamData === null || $scope.stateParamData.record === undefined || $scope.stateParamData.record === null){
                if($scope.stateParamMetaData.layout.type !== 'Create'){
                    $dialog.alert('No input data found!','Warning','pficon pficon-warning-triangle-o');
                }
                $scope.metadata = metadata;
                return;
            }
            $scope.back.allow = true;
            if(!$scope.blockUI.layoutBlock.state().blocking && metadata !== undefined){
                if(!$scope.queryObject){
                    $scope.queryObject = {
                        selectFields: ["Id"],
                        sObject: $scope.stateParamData.record.attributes.type,
                        whereFields: { "Id" : $scope.stateParamData.record.Id },
                        type: $scope.stateParamMetaData.layout.type
                    }
                    // angular.forEach(metadata.layoutSections,function(section,sectionIndex){
                    //     angular.forEach(section.columns,function(fields, columnIndex){
                    //         angular.forEach(fields,function(field,fieldIndex){
                    //             if($scope.queryObject.selectFields.indexOf(field.SObjectField.name) === -1){
                    //                 $scope.queryObject.selectFields.push(field.SObjectField.name);
                    //                 if(field.SObjectField.type === 'reference'){
                    //                     if(field.SObjectField.reference === undefined){
                    //                         $scope.queryObject.selectFields.push(field.SObjectField.relationshipName + '.Name');
                    //                     }else{
                    //                         $scope.queryObject.selectFields.push(field.SObjectField.relationshipName + '.' +field.SObjectField.reference);
                    //                     }
                    //                 }
                    //             }
                    //         });
                    //     });
                    // });
                }
                $scope.blockUI.layoutBlock.start('Loading details...');
                clientSObjectService.details($scope.queryObject)
                    .success(function(response){
                        $scope.blockUI.layoutBlock.stop();
                        $scope.metadata = metadata;
                        if(response.success){
                            $scope.dataModel = response.data.dataModel;
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                    })
                    .error(function(response){
                        $scope.metadata = metadata;
                        $dialog.alert('Server error occured while loading details.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.layoutBlock.stop();
                    });
            }
        };
        $scope.back = {
            allow: false,
            go: function(){
            	var stateName = ($stateParams.data !== undefined && $stateParams.data !== null && $stateParams.data.isFromDashboard && $stateParams.data.isFromDashboard === true) ? 'client.dashboard' : $stateParams.metadata.redirectTo; 
            	var stateCache = $appCache.get(stateName);
            	if(stateCache!= undefined){
            		stateCache.btnClick="cancel";
            	}
            	$appCache.put(stateName, stateCache);
            	$state.go(stateName);
            }, 
            saveGo: function(){
            	var stateName = ($stateParams.data !== undefined && $stateParams.data !== null && $stateParams.data.isFromDashboard && $stateParams.data.isFromDashboard === true) ? 'client.dashboard' : $stateParams.metadata.redirectTo; 
            	var stateCache = $appCache.get(stateName);
            	if(stateCache!= undefined){
            		stateCache.btnClick="save";
            	}
            	$appCache.put(stateName, stateCache);
            	$state.go(stateName);
            }  
        };
        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                layoutBlock: blockUI.instances.get('layoutBlock'),
            };
        };
        $scope.executeEvent = function(event, paramValues){
            $rootScope.eventName = event.name;
            switch(event.name){
                case 'showAlert'	: alert('Showing alert!');break;
                // case 'changeLayout' : $scope.changeLayout(paramValues);break;
                case 'reloadLayout' : $scope.reloadLayout(paramValues);break;
                case 'disabledAndReloadLayout' : $scope.disabledAndReloadLayout(paramValues);break;
            }
        };
        $scope.disabledAndReloadLayout = function(paramValues){
            paramValues[1].disabled=true;
            $scope.blockUI.layoutBlock.start("Loading layout...");
            var sObjectLayoutSections = angular.copy($scope.metadata.layoutSections);
            sObjectLayoutSections.push({});
            $timeout(function(){
                sObjectLayoutSections.pop();
                angular.forEach($scope.metadata.layoutSections,function(section,sectionIndex){
                    if(!section.isComponent){
                        section.columns.forEach(function(column){
                            column.forEach(function(field){
                                field.rendered = true;
                            });
                        });
                        $scope.metadata.layoutSections[sectionIndex] = angular.copy(section);
                    }
                });
                // $scope.metadata.layoutSections = sObjectLayoutSections;
                $scope.blockUI.layoutBlock.stop();
            },100);
        };
        $scope.reloadLayout = function(paramValues){
            $scope.blockUI.layoutBlock.start("Loading layout...");
            var sObjectLayoutSections = angular.copy($scope.metadata.layoutSections);
            sObjectLayoutSections.push({});
            $timeout(function(){
                sObjectLayoutSections.pop();
                angular.forEach($scope.metadata.layoutSections,function(section,sectionIndex){
                    if(!section.isComponent){
                        section.columns.forEach(function(column){
                            column.forEach(function(field){
                                field.rendered = true;
                            });
                        });
                        $scope.metadata.layoutSections[sectionIndex] = angular.copy(section);
                    }
                });
                // $scope.metadata.layoutSections = sObjectLayoutSections;
                $scope.blockUI.layoutBlock.stop();
            },100);
        };
        $scope.save = function(){
            // $dialog.alert('Save button clicked!');
            var componentSaveCall=[];
            var queryObject = {
                operation: null,
                sObject: {
                    name: $scope.stateParamData ? $scope.stateParamData.record.attributes.type : $scope.stateParamMetaData.sobject.name,
                    data: null
                }
            }
            if($scope.stateParamMetaData.layout.type === 'Create'){
                queryObject.operation = 'CREATE';
                // $dialog.alert('This functionality is pending to implement.');
                // return;
            }else if($scope.stateParamMetaData.layout.type === 'Edit'){
                queryObject.operation = 'UPDATE';
            }else{
                return;
            }
            
            var sObjectData = {
                Id: $scope.dataModel.Id
            };
            var allSObjectData = {
                Id: $scope.dataModel.Id
            };
            var dataFields=[] ;
            var validationMessage="";
            angular.forEach($scope.metadata.layoutSections,function(section,sectionIndex){
                if(!section.isComponent){
                    if(section.readonly === false && section.rendered === true){
                        angular.forEach(section.columns,function(fields, columnIndex){
                            angular.forEach(fields,function(field,fieldIndex){
                                if(field.SObjectField.custom === true && field.readonly === false && field.enable === true && field.rendered != undefined && field.rendered === true){
                                    sObjectData[field.SObjectField.name] = field.value;
                                    dataFields.push(field);
                                }
                            });
                        });
                    }
                    if(section.rendered === true){
                        angular.forEach(section.columns,function(fields, columnIndex){
                            angular.forEach(fields,function(field,fieldIndex){
                                if(field.SObjectField.custom === true && field.enable === true && field.rendered != undefined && field.rendered === true){
                                	allSObjectData[field.SObjectField.name] = field.value;
                                }
                            });
                        });
                    }
                }
                if(section.isComponent){
                    if(section.readonly === false && section.rendered === true){
                        angular.forEach($scope.dataModel.sObjectData,function(fields, key){
                            if(key.includes("__c")|| key.includes("__r"))
                            {
                                sObjectData[key] = fields;
                            }
                        });
                        if(section.Component.name && $scope[section.Component.name.replace(/\s/g,"")+'Validate']){
                            $scope[section.Component.name.replace(/\s/g,"")+'Validate'](function(result){
                                if(!result.success){
                                    validationMessage+=result.message;
                                }
                            });
                        }
                        if(section.Component.name && $scope[section.Component.name.replace(/\s/g,"")+'Save']){
                            componentSaveCall.push(section.Component.name.replace(/\s/g,"")+'Save');
                        }
                    }
                    
          
                }
            });
            queryObject.sObject.data = sObjectData;
          
            if($scope.files && $scope.files.length > 0){
                queryObject.files = $scope.files;
            }
            
            
            clientSObjectService.isRequireValidation({sObjectData:sObjectData, allSObjectData: allSObjectData,fields:dataFields},function(result){
                if(result.success && validationMessage===""){
                    $scope.blockUI.layoutBlock.start('Saving values...');
                    angular.forEach(componentSaveCall,function(saveCall){
                        $scope[saveCall]();
                    });
                    clientSObjectService.save(queryObject)
                        .success(function(response){
                            $scope.blockUI.layoutBlock.stop();
                            if(response.success){
                                $scope.back.saveGo();
                            }else{
                                $dialog.alert(response.message,'Validation Alert','pficon-warning-triangle-o');
                            }
                        })
                        .error(function(response){
                            $dialog.alert('Server error occured while saving details.','Error','pficon pficon-error-circle-o');
                            $scope.blockUI.layoutBlock.stop();
                        });
                }
                else{
                    if(!result.success){
                        validationMessage=result.message+validationMessage
                    }
                    $dialog.alert(validationMessage,'Validation Alert','pficon-warning-triangle-o');
                }
            });
            
        }
        $scope.saveValidation = function(callback){
            // $dialog.alert('Save button clicked!');
            var componentSaveCall=[];
            var queryObject = {
                operation: null,
                sObject: {
                    name: $scope.stateParamData ? $scope.stateParamData.record.attributes.type : $scope.stateParamMetaData.sobject.name,
                    data: null
                }
            }
            if($scope.stateParamMetaData.layout.type === 'Create'){
                queryObject.operation = 'CREATE';
                // $dialog.alert('This functionality is pending to implement.');
                // return;
            }else if($scope.stateParamMetaData.layout.type === 'Edit'){
                queryObject.operation = 'UPDATE';
            }else{
                return {};
            }
            
            var sObjectData = {
                Id: $scope.dataModel.Id
            };
            var dataFields=[] ;
            var validationMessage="";
            angular.forEach($scope.metadata.layoutSections,function(section,sectionIndex){
                if(!section.isComponent){
                    if(section.readonly === false && section.rendered === true){
                        angular.forEach(section.columns,function(fields, columnIndex){
                            angular.forEach(fields,function(field,fieldIndex){
                                if(field.SObjectField.custom === true && field.readonly === false && field.enable === true && field.rendered != undefined && field.rendered === true){
                                    sObjectData[field.SObjectField.name] = field.value;
                                    dataFields.push(field);
                                }
                            });
                        });
                    }
                }
                if(section.isComponent){
                    if(section.readonly === false  && section.rendered === true ){
                        angular.forEach($scope.dataModel.sObjectData,function(fields, key){
                            if(key.includes("__c")|| key.includes("__r"))
                            {
                                sObjectData[key] = fields;
                            }
                        });
                        if(section.Component.name && $scope[section.Component.name.replace(/\s/g,"")+'Validate']){
                            $scope[section.Component.name.replace(/\s/g,"")+'Validate'](function(result){
                                if(!result.success){
                                    validationMessage+=result.message;
                                }
                            });
                        }
                        if(section.Component.name && $scope[section.Component.name.replace(/\s/g,"")+'Save']){
                            componentSaveCall.push(section.Component.name.replace(/\s/g,"")+'Save');
                        }
                    }
                    
          
                }
            });
            queryObject.sObject.data = sObjectData;
          
            if($scope.files && $scope.files.length > 0){
                queryObject.files = $scope.files;
            }
            
            
            clientSObjectService.isRequireValidation({sObjectData:sObjectData,fields:dataFields},function(result){
                if(!result.success){
                    validationMessage=result.message+validationMessage
                }
                var rtnResult={
                    result:result,
                    message:validationMessage,
                    componentSaveCall:componentSaveCall,
                    queryObject:queryObject
                }
                callback(rtnResult)
                
                
            });
            
        }
        
        $scope.finalSave = function(rtn){
            $scope.blockUI.layoutBlock.start('Saving values...');
            angular.forEach(rtn.componentSaveCall,function(saveCall){
                $scope[saveCall]();
            });
            clientSObjectService.save(rtn.queryObject)
            .success(function(response){
                $scope.blockUI.layoutBlock.stop();
                if(response.success){
                    $scope.back.saveGo();
                }else{
                    $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                }
            })
            .error(function(response){
                $dialog.alert('Server error occured while saving details.','Error','pficon pficon-error-circle-o');
                $scope.blockUI.layoutBlock.stop();
            });
        }


        $scope.init = function(){
            console.log('ClientSectionLayoutController loaded!');
            $scope.files = [];
            $scope.dataModel = {};
            $scope.stateParamMetaData = $state.current.params.metadata;
            $scope.stateParamData = $stateParams.data;
            $scope.initBlockUiBlocks();
            $scope.loadsObjectMetadata();
            $scope.loadLayoutMetadata();
            $scope.baseCtrl = this;
            $scope.dispayEditBtn=false;
            if($scope.stateParamData && $scope.stateParamData.editAction){
                $scope.dispayEditBtn=$scope.criteriaValidation($scope.stateParamData.editAction,$scope.stateParamData.record)
            }
        };
        $scope.init();
    }
]);