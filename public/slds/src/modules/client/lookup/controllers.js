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
                    currentPage: 1,
                    pageSize: 25,
                    hasMore: false,
                    orderByField: undefined,
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
                
                if($scope.lookupCache.searchResult === undefined){
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
                        if($scope.lookupCache.orderByField){
                            $scope.applyOrderBy($scope.lookupCache.orderByField);
                        }
                    },200);
                }
            }
        };
        $scope.loadLookupData = function(page,pageSize){
            if(!$scope.blockUI.loadSObjectLookup.state().blocking){
                var selectFields = [];
                angular.forEach($scope.metadata.SObjectLayoutFields,function(field,index){
                    selectFields.push(field);
                });
                var found = false;
                data.field.reference = (data.field.reference) ? data.field.reference : 'Name';
                angular.forEach(selectFields, function(field){
                    if(field.SObjectField.name === data.field.reference){
                        found = true;
                    }
                });
                if(!found && data.field.reference !== 'Id'){
                    selectFields.push({
                        SObjectField: {
                            name: data.field.reference,
                            type: 'string'
                        }
                    });
                }
                var queryObject = {
                    sObject: {
                        id: $scope.metadata.SObjectId,
                        name: $scope.metadata.sobjectname
                    },
                    selectFields: selectFields,
                    whereFields: {},
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
                            
                            $scope.lookupCache.searchResult = $scope.searchResult;
                            $scope.lookupCache.currentPage = $scope.currentPage;
                            $scope.lookupCache.pageSize = pageSize;
                            $scope.lookupCache.hasMore = $scope.hasMore;
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
            $scope.pageSize = 25;
            $scope.currentPage = 0;
            $scope.lookupCacheId = 'sobject.' + data.field.SObjectField.name +'_'+ data.field.SObjectLookupId + '.lookup';
            $scope.lookupCache = $appCache.get($scope.lookupCacheId);
            console.log('ClientSObjectLookupController loaded!');
            $scope.initBlockUiBlocks();
            $scope.loadLookupMetadata();
        };
        $scope.init();
    }
]);