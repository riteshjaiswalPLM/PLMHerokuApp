'use strict';
admin.controller('AdminMobileMyTaskController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        if(toState.name === 'admin.mobile.mytask' && fromState !== 'admin.mobile.mytask.list'){
            event.preventDefault();
            $state.go('admin.mobile.mytask.list');
        }
    });
    $scope.init = function(){
        console.log('AdminMobileMyTaskController loaded!');
        $state.go('admin.mobile.mytask.list');
    };
    $scope.init();
}]);

admin.controller('AdminMobileMyTaskListController',[
            '$scope','$state','mobileLayoutService','blockUI','$dialog','$timeout','$adminLookups','$controller',
    function($scope , $state , mobileLayoutService , blockUI , $dialog , $timeout , $adminLookups , $controller){
        var thisCtrl = this;
        $scope.init = function(){
            console.log('AdminMobileMyTaskListController loaded!');
            $scope.forMobile = true;
            $scope.listTemplateURL = 'slds/views/admin/component/dashboard-components/list.html';
            angular.extend(thisCtrl, $controller('AdminDashboardComponentsListController',{ $scope: $scope}))
        };
        $scope.init();
    }
]);

admin.controller('AdminMobileMyTaskEditController',[
            '$scope','$state','mobileLayoutService','blockUI','$dialog','$timeout','$adminLookups','$controller','$stateParams',
    function($scope , $state , mobileLayoutService , blockUI , $dialog , $timeout , $adminLookups , $controller , $stateParams){
        var thisCtrl = this;
        $scope.init = function(){
            console.log('AdminMobileMyTaskListController loaded!');
            $scope.forMobile = true;
            $scope.editTemplateURL = 'slds/views/admin/component/dashboard-components/edit.html';
            angular.extend(thisCtrl, $controller('AdminDashboardComponentsEditController',{ $scope: $scope, $stateParams: $stateParams}))
        };
        $scope.init();
    }
]);