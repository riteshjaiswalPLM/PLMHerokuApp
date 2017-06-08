'use strict';

auth.controller('LoginController',[
            '$scope','$rootScope','$state','loginService','blockUI','Notifications','$timeout','$window',
    function($scope , $rootScope , $state , loginService , blockUI , Notifications , $timeout , $window){
        $scope.login = function(){
            var loggingIn = blockUI.instances.get('loggingIn');
            loggingIn.start('Logging In ...');
            $scope.loggingIn = true;
            // $timeout(function(){
                loginService.login($scope.credentials)
                    .success(function(response){
                        loggingIn.stop();
                        $scope.loggingIn = false;
                        if(!response.success){
                            Notifications.error(response.message);
                        }else{
                            $rootScope.redirectTo();
                        }
                    })
                    .error(function(response){
                        loggingIn.stop();
                        $scope.loggingIn = false;
                    });
            // },3000);  
        };
        $scope.onClickGoToSSO = function(){
            $window.location.href = '/api/sso/login';
        };
        $scope.onClickResetPassLink =function(){
            $state.go('resetpasswordlink');
        };
        $scope.init = function(){
            $scope.credentials = {
                username: null,
                password: null
            }
        };
        $scope.init();
}]);

auth.controller('SSOLoginController',[
            '$scope','$rootScope','$state','loginService','blockUI','Notifications','$timeout','$stateParams','$window',
    function($scope , $rootScope , $state , loginService , blockUI , Notifications , $timeout , $stateParams , $window ){
        $scope.login = function(){
            var loggingIn = blockUI.instances.get('loggingIn');
            loggingIn.start('Logging In ...');
            $scope.loggingIn = true;
                loginService.login($scope.credentials)
                    .success(function(response){
                        loggingIn.stop();
                        $scope.loggingIn = false;
                        if(!response.success){
                            Notifications.error(response.message);
                        }else{
                            $window.location.href = '/';
                        }
                    })
                    .error(function(response){
                        loggingIn.stop();
                        $scope.loggingIn = false;
                    });
        };
        $scope.init = function(){
            $scope.credentials = {
                username: $stateParams.data,
                isSSOLogin: true
            }
            $scope.login();
        };
        $scope.init();
}]);

auth.controller('ResetPasswordLinkController',[
            '$scope','$rootScope','$state','resetPasswordService','blockUI','Notifications','$timeout',
    function($scope , $rootScope , $state , resetPasswordService , blockUI , Notifications , $timeout){
        $scope.resetpassword = function(){
            var loggingIn = blockUI.instances.get('resetPWD');
            $scope.resetpass = true;
            if($scope.credentials==null||$scope.credentials==undefined||$scope.credentials.username==null || $scope.credentials.username.trim()==""){
                Notifications.error('Username must not be blank');
                $scope.resetpass = false;
                return;
            }
            loggingIn.start('Reseting Password In ...');
            resetPasswordService.mailresetpasswordlink($scope.credentials)
                .success(function(response){
                    loggingIn.stop();
                    $scope.resetpass = false;
                    if(!response.success){
                        Notifications.error(response.message);
                    }else{
                        Notifications.success(response.message);
                        $rootScope.redirectTo();
                    }
                })
                .error(function(response){
                    loggingIn.stop();
                    $scope.resetpass = false;
                });
           
        };
        $scope.onCancel =function(){
            $state.go('login');
        };
        $scope.init = function(){
            console.log('ResetPasswordLinkController loaded!');
            $scope.credentials={
                username:null
            }
        };
        $scope.init();
}]);
auth.controller('ResetPasswordController',[
            '$scope','$rootScope','$state','resetPasswordService','blockUI','Notifications','$timeout','$stateParams',
    function($scope , $rootScope , $state , resetPasswordService , blockUI , Notifications , $timeout,$stateParams){
        $scope.newPassword = function(){

            if($scope.credentials.password === undefined || $scope.credentials.password ===null || $scope.credentials.password === ''
                || $scope.credentials.repassword === undefined || $scope.credentials.repassword ===null || $scope.credentials.repassword === ''  ){
                Notifications.error('Password field must not be blank');
                return
            }
            if(!(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d][A-Za-z\d!@#$%^&*()_+.]{5,19}$/).test($scope.credentials.password)){ 
                Notifications.error('Password format is invalid');
                return
            }
            if($scope.credentials.password !== $scope.credentials.repassword)
            {
                Notifications.error('Password Does not Match');
                return;
            }

            var data={
                id:$stateParams.data,
                password:$scope.credentials.password
            }
            var loggingIn = blockUI.instances.get('resetPWD');
            loggingIn.start('Reseting Password In ...');
            $scope.resetpass = true;
            
            resetPasswordService.resetpassword(data)
                .success(function(response){
                    loggingIn.stop();
                    $scope.resetpass = false;
                    if(!response.success){
                        Notifications.error(response.message);
                    }else{
                        Notifications.success(response.message);
                        $rootScope.redirectTo();
                    }
                })
                .error(function(response){
                    loggingIn.stop();
                    $scope.resetpass = false;
                });
           
        };
       
        $scope.init = function(){
            console.log('ResetPasswordController loaded!');
            $scope.resetpass = false;
            $scope.credentials={
                password    :null,
                repassword  :null
            }
            
            var data={
                id:$stateParams.data
            }
            resetPasswordService.checkresetpasswordlinkexpired(data)
            .success(function(response){
                if(!response.success){
                    Notifications.error(response.message);
                    $rootScope.redirectTo();
                }
            })
            .error(function(response){
            });
        };
        $scope.init();
}]);