'use strict';

admin.controller('AdminUserManagementUsersController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        if(toState.name === 'admin.usermanagement.users' && fromState !== 'admin.usermanagement.users.list'){
            event.preventDefault();
            $state.go('admin.usermanagement.users.list');
        }
    });
    $scope.init = function(){
        console.log('AdminUserManagementUsersController loaded!');
        $state.go('admin.usermanagement.users.list');
    };
    $scope.init();
}]);

admin.controller('AdminUserManagementUsersListController',[
        '$scope','$rootScope','$state','userService','$dialog','blockUI','ModalService',
function($scope , $rootScope , $state , userService , $dialog , blockUI , ModalService){
    $scope.loadUsers = function(){
        if(!$scope.blockUI.loadUsers.state().blocking){
            $scope.blockUI.loadUsers.start('Loading Users...');
            userService.loadUsers({})
                .success(function(response){
                    if(response.success){
                        $scope.users = response.data.users;
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                    $scope.blockUI.loadUsers.stop();
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading users.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.loadUsers.stop();
                });
        }
    };
    $scope.syncUsers = function(){
        if(!$scope.blockUI.loadUsers.state().blocking){
            $scope.blockUI.loadUsers.start('Syncing Users...');
            userService.syncUsers({})
                .success(function(response){
                    $scope.blockUI.loadUsers.stop();
                    if(response.success){
                        $scope.loadUsers();
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading users.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.loadUsers.stop();
                });
        }
    };
    $scope.initBlockUiBlocks = function(){
        $scope.blockUI = {
            loadUsers: blockUI.instances.get('loadUsers')
        };
    };
    $scope.init = function(){
        console.log('AdminUserManagementUsersListController loaded!');
        $scope.initBlockUiBlocks();
        $scope.loadUsers();
    };
    $scope.init();
}]);
