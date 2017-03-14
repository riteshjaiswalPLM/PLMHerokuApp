'use strict';

/**
 * App Controller
 */
app.controller('AppController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.init = function(){
        console.log('AppController loaded!');
        $rootScope.redirectTo();
    };
    $scope.init();
}]);