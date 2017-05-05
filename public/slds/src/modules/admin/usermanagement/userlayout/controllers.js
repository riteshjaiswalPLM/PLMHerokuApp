'use strict';

admin.controller('AdminUserManageUsersLayoutController',['$scope','$rootScope','$state','$stateParams','$controller','layoutService','$dialog',function($scope,$rootScope,$state,$stateParams,$controller,layoutService,$dialog){
    var thisCtrl = this;
    $scope.getuserprofilelayout = function(){
        layoutService.getuserprofilelayout({type:'Create'})
            .success(function(response){
                if(response.success){
                    $stateParams.layout = response.data.layouts;
                    $scope.editTemplateUrl = 'slds/views/admin/layout/edit.html';
                    angular.extend(thisCtrl, $controller('AdminLayoutsEditController',{ $scope: $scope, $stateParams:$stateParams}))
                    $scope.returnToListEnable = "";
                }
                else{
                    $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                }
            })
            .error(function(){
                $dialog.alert('Error occured while loading sobject fields.','Error','pficon pficon-error-circle-o');
            });
    }

    $scope.init = function(){
        console.log('AdminUserManageUsersLayoutController loaded!');
        $scope.getuserprofilelayout();
    };
    $scope.init();
}]);