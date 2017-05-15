'use strict';

admin.controller('AdminTabsListController',[
            '$scope','$state','tabService','blockUI','$dialog','$timeout',
    function($scope , $state , tabService , blockUI , $dialog , $timeout){
        
        $scope.loadTabs = function(){
            if(!$scope.blockUI.loadTabs.state().blocking){
                $scope.blockUI.loadTabs.start('Loading tabs...');
                tabService.loadTabs({
                    criteria: {
                        where: {
                            created: true
                        }
                    }
                })
                .success(function(response){
                    if(response.success){
                        $scope.tabs = response.data.tabs;
                        // $timeout(function(){
                        //     $('.table-treegrid').treegrid();
                        // },0);
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                    $scope.blockUI.loadTabs.stop();
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading tabs.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.loadTabs.stop();
                });
            }
        };
        $scope.deleteTab = function(tab){
            $dialog.confirm({
                title: 'Confirm delete ?',
                yes: 'Yes, Delete', no: 'Cancel',
                message: 'Are you sure to delete "'+ tab.label +'" tab ?',
                class:'danger'
            },function(confirm){
                if(confirm){
                    $scope.blockUI.loadTabs.start('Deleting "'+tab.label+'" tab...');
                    tabService.deleteTab(tab)
                        .success(function(response){
                            $scope.blockUI.loadTabs.stop();
                            if(response.success){
                                $scope.loadTabs();
                            }else{
                                $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                            }
                        })
                        .error(function (response) {
                            $scope.blockUI.loadTabs.stop();
                            $dialog.alert('Error occured while deleting tab.','Error','pficon pficon-error-circle-o');
                        });
                }
            });
        };
        
        $scope.edit = function(tab){
            $state.go('admin.tabs.edit',{tab: tab});
        };
        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                loadTabs: blockUI.instances.get('loadTabs')
            };
        };
        $scope.init = function(){
            console.log('AdminTabsListController loaded!');
            $scope.initBlockUiBlocks();
            $scope.loadTabs();
        };
        $scope.init();
    }
]);

admin.controller('AdminTabsEditController',[
            '$scope','$state','$stateParams','$dialog','$adminLookups','tabService','blockUI',
    function($scope , $state , $stateParams , $dialog , $adminLookups , tabService , blockUI ){
        
        $scope.openSObjectsLookup = function(){
            var data = {
                criteria: {
                    where: {
                        created: false
                    }
                }
            };
            $adminLookups.tab(data,function(tab){
                $scope.tab = tab;
            });
        };
        $scope.openIconsLookup = function(){
            $adminLookups.icon({},function(icon){
                $scope.tab.Icon = icon;
            });
        };
        $scope.saveTab = function(){
            var saveTab = blockUI.instances.get('saveTab');
            saveTab.start('Saving tab...');
            tabService.saveTab($scope.tab)
                .success(function(response){
                    saveTab.stop();
                    if(response.success){
                        $state.go('admin.tabs.list');
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                })
                .error(function(response){
                    saveTab.stop();
                    $dialog.alert('Error occured while saving tab.','Error','pficon pficon-error-circle-o');
                });
        };
        $scope.cancel = function(){
            $state.go('admin.tabs.list');  
        };
        
        $scope.init = function(){
            console.log('AdminTabsEditController loaded!');
            $scope.tab = ($stateParams.tab) ? $stateParams.tab : {
                label:null,
                SObject: null,
                Icon: null,
                active: false,
                order:0
            };
            $scope.stateAction = ($stateParams.tab) ? 'Edit' : 'Create';
        };
        $scope.init();
    }
]);