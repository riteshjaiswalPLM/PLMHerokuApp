/**
 * Admin Controllers
 */
admin.controller('AdminController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.init = function(){
        console.log('AdminController loaded!');
        $state.go('admin.tabs');
    };
    $scope.init();
}]);
admin.controller('AdminTabsController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        if(toState.name === 'admin.tabs' && fromState !== 'admin.tabs.list'){
            event.preventDefault();
            $state.go('admin.tabs.list');
        }
    });
    $scope.init = function(){
        console.log('AdminTabsController loaded!');
        $state.go('admin.tabs.list');
    };
    $scope.init();
}]);
admin.controller('AdminLayoutsController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        if(toState.name === 'admin.layouts' && fromState !== 'admin.layouts.list'){
            event.preventDefault();
            $state.go('admin.layouts.list');
        }
    });
    $scope.init = function(){
        console.log('AdminLayoutsController loaded!');
        $state.go('admin.layouts.list');
    };
    $scope.init();
}]);
admin.controller('AdminLookupsController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        if(toState.name === 'admin.lookups' && fromState !== 'admin.lookups.list'){
            event.preventDefault();
            $state.go('admin.lookups.list');
        }
    });
    $scope.init = function(){
        console.log('AdminLookupsController loaded!');
        $state.go('admin.lookups.list');
    };
    $scope.init();
}]);
admin.controller('AdminUserManagementController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        if(toState.name === 'admin.usermanagement' && fromState !== 'admin.usermanagement.users'){
            event.preventDefault();
            $state.go('admin.usermanagement.users');
        }
    });
    $scope.init = function(){
        console.log('AdminUserManagementController loaded!');
        $state.go('admin.usermanagement.users');
    };
    $scope.init();
}]);
admin.controller('AdminSetupController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        if(toState.name === 'admin.setup' && fromState !== 'admin.setup.sfdc'){
            event.preventDefault();
            $state.go('admin.setup.sfdc');
        }
    });
    $scope.init = function(){
        console.log('AdminSetupController loaded!');
        $state.go('admin.setup.sfdc');
    };
    $scope.init();
}]);
admin.controller('AdminMobileController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        if(toState.name === 'admin.mobile' && fromState !== 'admin.mobile.sobjects'){
            event.preventDefault();
            $state.go('admin.mobile.sobjects');
        }
    });
    $scope.init = function(){
        console.log('AdminMobileController loaded!');
        $state.go('admin.mobile.sobjects');
    };
    $scope.init();
}]);
admin.controller('AdminLanguagesController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        if(toState.name === 'admin.languages' && fromState !== 'admin.languages.list'){
            event.preventDefault();
            $state.go('admin.languages.list');
        }
    });
    $scope.init = function(){
        console.log('AdminLanguagesController loaded!');
        $state.go('admin.languages.list');
    };
    $scope.init();
}]);
admin.controller('AdminComponentsController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        if(toState.name === 'admin.components' && fromState !== 'admin.components.generic'){
            event.preventDefault();
            $state.go('admin.components.generic');
        }
    });
    $scope.init = function(){
        console.log('AdminComponentsController loaded!');
        $state.go('admin.components.generic');
    };
    $scope.init();
}]);