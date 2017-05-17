client.controller('ClientArchivalController',[
            '$scope','$rootScope','$state','$stateParams','$dialog', 'blockUI', 'authService', 'ArchivalService',
    function($scope , $rootScope , $state ,$stateParams, $dialog, blockUI, authService, ArchivalService){
        $scope.blockUI = {
                searchArchivedCriteriaBlock: blockUI.instances.get('searchArchivedCriteriaBlock'),
            };
            $scope.searchResults=[];
        $scope.searchCriteriaFields = [
            {
                name:"esm_ref_no",
                label:"ESM Ref No",
                type:"string"
            },
            {
                name:"document_type",
                label:"Document Type",
                type:"picklist",
                picklistvalues:['PO Invoice', 'Non PO Invoice', 'Debit/Credit Note', 'Check Request']
            },
            {
                name:"invoice_type",
                label:"Invoice Type",
                type:"picklist",
                picklistvalues:['Goods/Material', 'Non PO Invoice','Professional Service','Service','Special Handling']
            }
        ];
        $scope.search = function(){
            $scope.blockUI.searchArchivedCriteriaBlock.start('Searching.....');
            var filterparams = [], filtermap={};
            angular.forEach($scope.searchCriteriaFields, function(obj, key){
                if(angular.isDefined(obj.value) && obj.value!='' && obj.type!='picklist'){
                    filtermap[obj.name]='*' + obj.value + '*';
                }else{
                    filtermap[obj.name]= obj.value;
                }
            });
            ArchivalService.getArchivedInvoices(filtermap)
                .success(function(response){
                    $scope.blockUI.searchArchivedCriteriaBlock.stop();
                    if(response.data.records.length == 0){
                        $dialog.alert('No data found','','');
                        $scope.searchResults.length = 0;
                    }
                    else{
                        angular.copy(response.data.records,$scope.searchResults);
                    }
                    
                })
                .error(function(){
                    $scope.blockUI.searchArchivedCriteriaBlock.stop();
                    $dialog.alert('Server error occured while loading archived invoices.','Error','pficon pficon-error-circle-o');
                });
        };

        $scope.reset = function(){
            angular.forEach($scope.searchCriteriaFields, function(obj, key){
                if(angular.isDefined(obj.value)){
                    obj.value = undefined;
                }
            });
            $scope.searchResults.length = 0;
        };
        $scope.init=function(){
             $scope.icon = $stateParams.icon;
        }
        $scope.init();
    }]);