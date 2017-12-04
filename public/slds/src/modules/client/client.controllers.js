/**
 * Client Controllers
 */
client.controller('ClientController',[
            '$scope','$rootScope','$state','$dialog','authService','ClientProfileService',
    function($scope , $rootScope , $state , $dialog , authService , ClientProfileService){
        $scope.tabs = []
        $scope.profile = {};

        $scope.configureStateProviderStates = function(states){
            angular.forEach(states,function(state){
                if(state.tab != undefined){
                    $scope.tabs.push(state);
                }
            });
            
            $rootScope.configureStateProviderStates(states,function(homeState){
                if(homeState){
                    $state.go(homeState);
                }else{
                    $state.go($scope.tabs[0].name);
                }
            });  
            $rootScope.configureLanguages();
        };
        $scope.loadClientStates = function(){
            authService.loadstates($rootScope.user())
                .success(function(response){
                    if(response.success){
                        $scope.showReportTab = response.data.reportTab;
                        if(response.data.hasOwnProperty('profile')){
                            $scope.profile = angular.copy(response.data.profile);
                            response.data.states.push($scope.profile[0]);
                        }
                        $scope.configureStateProviderStates(response.data.states);
                    }
                })
                .error(function(response){
                    $dialog.alert('Unexpected error occured!');
                });
        };

        $scope.getUserProfileImg = function () {
            var userData = JSON.parse($rootScope.user().userdata);
            ClientProfileService.getUserProfileImg({ Id: userData.Id })
                .success(function (response) {
                    if (response.success) {
                        $scope.userProfileImg = response.path;
                    }
                });
        };

        $scope.init = function(){
            console.log('ClientController loaded!');
            $scope.userProfileImg = '/resources/images/profiles/userAvatar.jpg';
            $scope.loadClientStates();
            $scope.getUserProfileImg();
        };
        $scope.init();
    }
]);

client.controller('ClientProfileController',[
            '$scope','$rootScope','$controller','$state',
    function($scope , $rootScope , $controller , $state){
        $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
            if(toState.name === 'client.profile' && fromState !== 'client.profile.manage'){
                event.preventDefault();
                $state.go('client.profile.manage');
            }
        });
        $scope.init = function(){
            console.log('ClientProfileController loaded!');
             if($state.current.name === 'client.profile' && $state.current.name !== 'client.profile.manage'){
                 $state.go('client.profile.manage');
             }
        };
        $scope.init();
    }
]);