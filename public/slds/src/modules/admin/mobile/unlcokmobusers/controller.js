'use strict';
admin.controller('AdminUnlockMobUsersController',['$scope','$rootScope','$state','$http','blockUI','$dialog', 'unlockmobuserservice',
    function($scope,$rootScope,$state,$http,blockUI,$dialog,unlockmobuserservice){
        $scope.lockedusers = [],$scope.ids=[],$scope.deleteusers=[];
        unlockmobuserservice.loadLockedMobUsers({instanceurl:"https://esmqa-node.herokuapp.com"})
        .success(function (response) {
            console.log('response:-',response.data);
            $scope.lockedusers=angular.copy(response.data);
        })
        .error(function(response){
            $dialog.alert('Error occured while loading locked mobile users.','Error','pficon pficon-error-circle-o');
            //$scope.blockUI.sObjectFields.stop();
        });

        $scope.toggle = function(user){
            console.log('user',user);
        };

        $scope.unlockusers = function(){
            //$scope.blockUI.unlockmobileusers.start('Unlocking ...');
            angular.forEach($scope.lockedusers, function(value, key) {
                if(value.unlock != undefined && value.unlock){
                    $scope.ids.push(value.id);
                    $scope.deleteusers.push(value);
                }
                
            });
            if($scope.ids.length==0){
                console.log('Please select atleast one user to unlock.');
            }else{
                unlockmobuserservice.unlockMobUsers({mobusers:$scope.ids})
                    .success(function (response) {
                        console.log('response:-',response.status);
                        $scope.ids.length=0;
                        angular.forEach($scope.deleteusers, function(value, key) {
                            var index = $scope.lockedusers.indexOf(value);
                            $scope.lockedusers.splice(index,1);
                        });
                        //$scope.blockUI.unlockmobileusers.stop();
                })
                .error(function(response){
                    $dialog.alert('Error occured while unlocking mobile users.','Error','pficon pficon-error-circle-o');
                    //$scope.blockUI.unlockmobileusers.stop();
                });
            }
            //console.log($scope.ids);
        }

}]);

