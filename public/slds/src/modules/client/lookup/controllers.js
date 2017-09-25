'use strict';

client.controller('ClientSObjectLookupController',[
            '$scope','$rootScope','$state','$stateParams','$filter','$timeout','$element','$appCache','$dialog','clientSObjectLookupService','clientSObjectService','blockUI','data','close',
    function($scope , $rootScope , $state , $stateParams , $filter , $timeout , $element , $appCache , $dialog , clientSObjectLookupService , clientSObjectService , blockUI , data , close){
        var orderBy = $filter('orderBy');
        $scope.loadLookupMetadata = function(){
            if($scope.lookupCache === undefined){
                $scope.lookupCache = {
                    metadata: undefined,
                    searchResult: undefined,
                    sObjectLookupFilter: "",
                    currentPage: 1,
                    pageSize: 25,
                    hasMore: false,
                    orderByField: undefined,
                    isParentValueMatch: false
                };
            }
            if($scope.lookupCache.metadata === undefined){
                
                $scope.blockUI.loadSObjectLookup.start('Loading lookup...');
                
                clientSObjectLookupService.metadata(data.field)
                    .success(function(response){
                        $scope.blockUI.loadSObjectLookup.stop();
                        if(response.success === true){
                            $scope.metadata = response.data.metadata;
                            $scope.lookupCache.metadata = $scope.metadata;
                            $appCache.put($scope.lookupCacheId, $scope.lookupCache);
                            $timeout(function(){
                                $scope.loadLookupData(1, $scope.pageSize);
                            },100);
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                    })
                    .error(function(response){
                        $scope.blockUI.loadSObjectLookup.stop();
                        $dialog.alert('Server error occured while loading lookup metadata.','Error','pficon pficon-error-circle-o');
                    });
            }else{
                $timeout(function(){
                    $scope.metadata = $scope.lookupCache.metadata;
                },100);
                
                if($scope.lookupCache.searchResult === undefined || $scope.lookupCache.isParentValueMatch){
                    $timeout(function(){
                        $scope.loadLookupData(1, $scope.pageSize);
                    },100);
                }else{
                    $timeout(function(){
                        $scope.searchResult = $scope.lookupCache.searchResult;
                        if(data.field.excludeCurrentUser == true){
                            var userDataId=JSON.parse($rootScope.user().userdata)['Id'];
                            $scope.searchResult = $filter('filter')($scope.searchResult, {Id:'!'+userDataId});
                        }
                        $scope.currentPage = $scope.lookupCache.currentPage;
                        $scope.pageSize = $scope.lookupCache.pageSize;
                        $scope.sObjectLookupFilter = $scope.lookupCache.sObjectLookupFilter;
                        if($scope.lookupCache.orderByField){
                            $scope.applyOrderBy($scope.lookupCache.orderByField);
                        }
                    },200);
                }
            }
        };
        $scope.createCriteria = function(whereClauseString,field){
            if($scope.sObjectLookupFilter != null && $scope.sObjectLookupFilter!=""){
                if (field.SObjectField.type && (field.SObjectField.type === "string" || field.SObjectField.type === "email")) {
                    whereClauseString += field.SObjectField.name + " Like '%" + $scope.sObjectLookupFilter + "%' OR ";
                }
                else if (field.SObjectField.type && field.SObjectField.type === "int") {
                    if (!isNaN($scope.sObjectLookupFilter) && !$scope.sObjectLookupFilter.contains(".")) {
                        whereClauseString += field.SObjectField.name + " = " + $scope.sObjectLookupFilter + " OR ";
                    }
                }
                else if (field.SObjectField.type && (field.SObjectField.type === "double" || field.SObjectField.type === "currency")) {
                    if (!isNaN($scope.sObjectLookupFilter)) {
                        if ($scope.sObjectLookupFilter.contains(".")) {
                            if ($scope.sObjectLookupFilter.substring(0, $scope.sObjectLookupFilter.length - 1).contains(".")) {
                                whereClauseString += field.SObjectField.name + " = " + $scope.sObjectLookupFilter + " OR ";
                            }
                        }
                        else {
                            whereClauseString += field.SObjectField.name + " = " + $scope.sObjectLookupFilter + " OR ";
                        }
                    }
                }
                else if (field.SObjectField.type && field.SObjectField.type === "boolean") {
                    if ($scope.sObjectLookupFilter.toLowerCase() == "true" || $scope.sObjectLookupFilter.toLowerCase() == "false") {
                        whereClauseString += field.SObjectField.name + " = " + $scope.sObjectLookupFilter + " OR ";
                    }
                }
                else if (field.SObjectField.type && field.SObjectField.type === "picklist") {
                    whereClauseString += field.SObjectField.name + " in ('" + $scope.sObjectLookupFilter + "') OR ";
                }
                // else if(field.SObjectField.type && field.SObjectField.type === "date"){
                //     whereClauseString += field.SObjectField.name + " = " + $scope.sObjectLookupFilter + " OR ";
                // }
                // else if(field.SObjectField.type && field.SObjectField.type === "datetime"){
                //     whereClauseString += field.SObjectField.name + " = " + $scope.sObjectLookupFilter + "T00:00:00Z OR ";
                // }
                if(field.SObjectField.type === 'reference'){
                    var referenceField = field.SObjectField.relationshipName + '.' + field.reference;
                    if(whereClauseString.indexOf(referenceField) === -1){
                        whereClauseString += referenceField + " Like '%" + $scope.sObjectLookupFilter + "%' OR ";
                    }
                }
            }
            return whereClauseString;
        }
        $scope.editWhereClauseStr = function (whereClauseString, callback) {
            var whereClauseStringTmp = whereClauseString;
            var fieldsTobeReplaced = [];
            var parentCall = false;
            var userCall = false;
            while (whereClauseStringTmp.indexOf('{PARENT') > -1) {
                $scope.lookupCache.isParentValueMatch = true;
                var start = whereClauseStringTmp.indexOf('{PARENT') + 8;
                var stop = whereClauseStringTmp.indexOf('}', start);
                var fieldTobeReplaced = whereClauseStringTmp.substring(start, stop);
                fieldsTobeReplaced.push(fieldTobeReplaced);
                whereClauseStringTmp = whereClauseStringTmp.replace(whereClauseStringTmp.substring(start - 8, stop + 1), fieldTobeReplaced);
            }
            if (fieldsTobeReplaced.length > 0) {
                clientSObjectService.getFieldType({ sobjectname: $scope.dataModal.attributes.type, fieldname: fieldsTobeReplaced })
                    .success(function (response) {
                        if (response.success) {
                            while (whereClauseString.indexOf('{PARENT') > -1) {
                                var start = whereClauseString.indexOf('{PARENT') + 8;
                                var stop = whereClauseString.indexOf('}', start);
                                var fieldTobeReplaced = whereClauseString.substring(start, stop);
                                if (response.fieldDataTypes[fieldTobeReplaced] == "multipicklist") {
                                    whereClauseString = whereClauseString.replace(whereClauseString.substring(start - 8, stop + 1), $scope.dataModal[fieldTobeReplaced] ? $scope.dataModal[fieldTobeReplaced].toString().split(';').join("','") : '');
                                }
                                else {
                                    whereClauseString = whereClauseString.replace(whereClauseString.substring(start - 8, stop + 1), $scope.dataModal[fieldTobeReplaced]);
                                }
                            }
                            parentCall = true;
                            if (parentCall && userCall) {
                                callback(whereClauseString);
                            }
                        }
                    });
            }
            else {
                parentCall = true;
                if (parentCall && userCall) {
                    callback(whereClauseString);
                }
            }

            var userData = JSON.parse($rootScope.user().userdata);
            fieldsTobeReplaced = [];
            while (whereClauseStringTmp.indexOf('{LOGGED_IN_USER') > -1) {
                var start = whereClauseStringTmp.indexOf('{LOGGED_IN_USER') + 16;
                var stop = whereClauseStringTmp.indexOf('}', start);
                var fieldTobeReplaced = whereClauseStringTmp.substring(start, stop);
                fieldsTobeReplaced.push(fieldTobeReplaced);
                whereClauseStringTmp = whereClauseStringTmp.replace(whereClauseStringTmp.substring(start - 16, stop + 1), fieldTobeReplaced);
            }

            if (fieldsTobeReplaced.length > 0) {
                clientSObjectService.getFieldType({ sobjectname: '', fieldname: fieldsTobeReplaced })
                    .success(function (response) {
                        if (response.success) {
                            while (whereClauseString.indexOf('{LOGGED_IN_USER') > -1) {
                                var start = whereClauseString.indexOf('{LOGGED_IN_USER') + 16;
                                var stop = whereClauseString.indexOf('}', start);
                                var fieldTobeReplaced = whereClauseString.substring(start, stop);

                                if (response.fieldDataTypes[fieldTobeReplaced] == "multipicklist") {
                                    whereClauseString = whereClauseString.replace(whereClauseString.substring(start - 16, stop + 1), userData[fieldTobeReplaced] ? userData[fieldTobeReplaced].split(';').join("','") : '');
                                }
                                else {
                                    whereClauseString = whereClauseString.replace(whereClauseString.substring(start - 16, stop + 1), userData[fieldTobeReplaced]);
                                }
                            }
                            userCall = true;
                            if (parentCall && userCall) {
                                callback(whereClauseString);
                            }
                        }
                    });
            }
            else {
                userCall = true;
                if (parentCall && userCall) {
                    callback(whereClauseString);
                }
            }
        };
        $scope.loadLookupData = function(page,pageSize){
            if(!$scope.blockUI.loadSObjectLookup.state().blocking){
                var selectFields = [];
                var whereClauseString="";
                angular.forEach($scope.metadata.SObjectLayoutFields,function(field,index){
                    selectFields.push(field);
                    whereClauseString=$scope.createCriteria(whereClauseString,field);
                });
                
                var found = false;
                data.field.reference = (data.field.reference) ? data.field.reference : 'Name';
                angular.forEach(selectFields, function(field){
                    if(field.SObjectField.name === data.field.reference){
                        found = true;
                    }
                });
                if(!found && data.field.reference !== 'Id'){
                    var reffield={
                        SObjectField: {
                            name: data.field.reference,
                            type: 'string'
                        }
                    };
                    selectFields.push(reffield);
                    whereClauseString=$scope.createCriteria(whereClauseString,reffield);
                }
                if(whereClauseString!=""){
                    whereClauseString=whereClauseString.substring(0,whereClauseString.length-4);
                    if ($scope.metadata.whereClause !== undefined && $scope.metadata.whereClause !== null && $scope.metadata.whereClause !== "") {
                        whereClauseString = $scope.metadata.whereClause + ' AND (' + whereClauseString + ')';
                    }
                }
                else if ($scope.metadata.whereClause !== undefined && $scope.metadata.whereClause !== null && $scope.metadata.whereClause !== "") {
                    whereClauseString = $scope.metadata.whereClause;
                }
                $scope.editWhereClauseStr(whereClauseString, function (whereClauseString) {
                    var queryObject = {
                        sObject: {
                            id: $scope.metadata.SObjectId,
                            name: $scope.metadata.sobjectname
                        },
                        selectFields: selectFields,
                        whereFields: {},
                        whereClauseString: whereClauseString,
                        limit: pageSize,
                        page: page
                    };

                    $scope.blockUI.loadSObjectLookup.start('Loading data ...');
                    clientSObjectService.search(queryObject)
                        .success(function(response){
                            if(response.success){
                                $scope.searchResult = response.data.searchResult;
                                if(data.field.excludeCurrentUser == true){
                                    var userDataId=JSON.parse($rootScope.user().userdata)['Id'];
                                    $scope.searchResult = $filter('filter')($scope.searchResult, {Id:'!'+userDataId});
                                }
                                $scope.currentPage = response.data.currentPage;
                                $scope.hasMore = response.data.hasMore;

                                if ($scope.sObjectLookupFilter == "") {
                                    $scope.lookupCache.searchResult = $scope.searchResult;
                                    $scope.lookupCache.currentPage = $scope.currentPage;
                                    $scope.lookupCache.pageSize = pageSize;
                                    $scope.lookupCache.hasMore = $scope.hasMore;
                                    $scope.lookupCache.sObjectLookupFilter = $scope.sObjectLookupFilter;
                                }
                                $appCache.put($scope.lookupCacheId, $scope.lookupCache);
                            }else{
                                $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                            }
                            $scope.blockUI.loadSObjectLookup.stop();
                        })
                        .error(function(response){
                            $dialog.alert('Server error occured while querying lookup data.','Error','pficon pficon-error-circle-o');
                            $scope.blockUI.loadSObjectLookup.stop();
                        });
                });
            }
        };
        $scope.applyOrderBy = function(field){
            if($scope.searchResult && $scope.searchResult.length > 0){
                $scope.predicate = field.SObjectField.name;
                $scope.reverse = ($scope.predicate === field.SObjectField.name) ? !$scope.reverse : false;
                $scope.searchResult = orderBy($scope.searchResult, field.SObjectField.name, $scope.reverse);
                
                $scope.lookupCache.orderByField = field;
                $appCache.put($scope.lookupCacheId, $scope.lookupCache);
            }
        };
        
        $scope.close = function(){
            $element.modal('hide');
        };
        $scope.selectAndClose = function(sObject){
            var response = undefined;
            if(sObject !== undefined){
                response = {
                    value: sObject.Id,
                    labelValue: sObject[data.field.reference]
                }
            }
            $element.modal('hide');
            close(response, 500);
        }
        
        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                loadSObjectLookup: blockUI.instances.get('loadSObjectLookup'),
            };
        };
        $scope.init = function(){
            $scope.pageSizes = [25,50,100,200];
            $scope.sObjectLookupFilter="";
            $scope.pageSize = 25;
            $scope.currentPage = 0;
            $scope.lookupCacheId = 'sobject.' + data.field.SObjectField.name +'_'+ data.field.SObjectLookupId + '.lookup';
            $scope.lookupCache = $appCache.get($scope.lookupCacheId);
            $scope.dataModal = data.dataModal;
            console.log('ClientSObjectLookupController loaded!');
            $scope.initBlockUiBlocks();
            $scope.loadLookupMetadata();
        };
        $scope.init();
    }
]);