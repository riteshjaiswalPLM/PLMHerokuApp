'use strict';

admin.controller('AdminUserManagementRolesController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        if(toState.name === 'admin.usermanagement.roles' && fromState !== 'admin.usermanagement.roles.list'){
            event.preventDefault();
            $state.go('admin.usermanagement.roles.list');
        }
    });
    $scope.init = function(){
        console.log('AdminUserManagementRolesController loaded!');
        $state.go('admin.usermanagement.roles.list');
    };
    $scope.init();
}]);

admin.controller('AdminUserManagementRolesListController',[
        '$scope','$rootScope','$state','roleService','$dialog','blockUI','ModalService',
function($scope , $rootScope , $state , roleService , $dialog , blockUI , ModalService){
    $scope.loadUserRoles = function(){
        if(!$scope.blockUI.loadUserRoles.state().blocking){
            $scope.blockUI.loadUserRoles.start('Loading User roles...');
            roleService.loadUserRoles({})
                .success(function(response){
                    if(response.success){
                        $scope.userRoles = response.data.roles;
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                    $scope.blockUI.loadUserRoles.stop();
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading user roles.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.loadUserRoles.stop();
                });
        }
    };
    $scope.edit = function(role){
        ModalService.showModal({
            templateUrl: 'slds/views/admin/usermanagement/roles/edit.html',
            controller:'AdminUserManagementRolesEditController',
            inputs:{
                data: {
                    role: (role) ? angular.copy(role) : undefined,
                    title: (role) ? 'Edit Role' : 'New Role'  
                }
            }
        }).then(function(modal){
            modal.element.modal({backdrop: 'static', keyboard: false});
            modal.close.then(function(role){
                $scope.loadUserRoles();
            });
        });
    };
    $scope.deleteRole = function(role){
        $dialog.confirm({
            title: 'Confirm delete ?',
            yes: 'Yes, Delete', no: 'Cancel',
            message: 'By deleting "' + role.name + '" role, all users with this role will be updated.\n Are you sure ?',
            class:'destructive',
            headerClass:'error'
        },function(confirm){
            if(confirm){
                $scope.blockUI.loadUserRoles.start('Deleting '+ role.name +'...');
                roleService.deleteRole(role)
                    .success(function(response){
                        $scope.blockUI.loadUserRoles.stop();
                        if(response.success === true){
                            $scope.loadUserRoles();
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                    })
                    .error(function (response) {
                        $scope.blockUI.loadUserRoles.stop();
                        $dialog.alert('Error occured while deleting role.','Error','pficon pficon-error-circle-o');
                    });
            }
        });
    }
    $scope.initBlockUiBlocks = function(){
        $scope.blockUI = {
            loadUserRoles: blockUI.instances.get('loadUserRoles')
        };
    };
    $scope.init = function(){
        console.log('AdminUserManagementRolesListController loaded!');
        $scope.initBlockUiBlocks();
        $scope.loadUserRoles();
    };
    $scope.init();
}]);

admin.controller('AdminUserManagementRolesEditController',[
        '$scope','$rootScope','$state','roleService','$dialog','blockUI','data','close','$element',
function($scope , $rootScope , $state , roleService , $dialog , blockUI , data , close , $element){
    $scope.title = (data.title) ? data.title : 'Loading...';
    $scope.role = (data.role) ? data.role : {};
    $scope.isNewRole = data.role === undefined || data.role === null;
    $scope.close = function(){
        $element.modal('hide');
    };
    $scope.save = function(){
        if(!$scope.blockUI.editRole.state().blocking){
            $scope.blockUI.editRole.start('Saving role...');
            roleService.saveUserRole($scope.role, $scope.isNewRole)
                .success(function(response){
                    $scope.blockUI.editRole.stop();
                    if(response.success === true){
                        $element.modal('hide');
                        close($scope.role, 500);
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                })
                .error(function(response){
                    $dialog.alert('Error occured while saving user role.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.editRole.stop();
                });
        }
    }
    $scope.initBlockUiBlocks = function(){
        $scope.blockUI = {
            editRole: blockUI.instances.get('editRole')
        };
    };
    $scope.init = function(){
        console.log('AdminUserManagementRolesEditController loaded!');
        $scope.initBlockUiBlocks();
    };
    $scope.init();
}]);
