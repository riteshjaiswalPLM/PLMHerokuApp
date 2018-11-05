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
//let's make a startFrom filter
app.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
});