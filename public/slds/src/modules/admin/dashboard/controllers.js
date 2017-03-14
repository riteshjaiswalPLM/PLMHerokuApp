'use strict';

admin.controller('AdminDashboardController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.init = function(){
        console.log('AdminDashboardController loaded!');
    };
    $scope.init();
}]);