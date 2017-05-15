'use strict';

admin.controller('AdminUserManagementUsersController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        if(toState.name === 'admin.usermanagement.users' && fromState !== 'admin.usermanagement.users.list'){
            event.preventDefault();
            $state.go('admin.usermanagement.users.list');
        }
    });
    $scope.init = function(){
        console.log('AdminUserManagementUsersController loaded!');
        $state.go('admin.usermanagement.users.list');
    };
    $scope.init();
}]);

admin.controller('AdminUserManagementUsersListController',[
        '$scope','$rootScope','$state','userService','$dialog','blockUI','ModalService',
function($scope , $rootScope , $state , userService , $dialog , blockUI , ModalService){
    $scope.loadUsers = function(){
        if(!$scope.blockUI.loadUsers.state().blocking){
            $scope.blockUI.loadUsers.start('Loading Users...');
            userService.loadUsers({})
                .success(function(response){
                    if(response.success){
                        $scope.users = response.data.users;
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                    $scope.blockUI.loadUsers.stop();
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading users.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.loadUsers.stop();
                });
        }
    };
    $scope.createUsers = function(){
          $state.go('admin.usermanagement.users.create',{});  
    }
    $scope.editUser = function(user){
          $state.go('admin.usermanagement.users.edit',{userData:user});  
    }
    $scope.syncUsers = function(){
        if(!$scope.blockUI.loadUsers.state().blocking){
            $scope.blockUI.loadUsers.start('Syncing Users...');
            userService.syncUsers({})
                .success(function(response){
                    $scope.blockUI.loadUsers.stop();
                    if(response.success){
                        $scope.loadUsers();
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading users.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.loadUsers.stop();
                });
        }
    };
    $scope.initBlockUiBlocks = function(){
        $scope.blockUI = {
            loadUsers: blockUI.instances.get('loadUsers')
        };
    };
    $scope.init = function(){
        console.log('AdminUserManagementUsersListController loaded!');
        $scope.initBlockUiBlocks();
        $scope.loadUsers();
    };
    $scope.init();
}]);

admin.controller('AdminUserManagementUsersCreateController',[
            '$scope','$rootScope','$controller','$stateParams','$state','$http','userService','blockUI','$dialog',
    function($scope , $rootScope , $controller , $stateParams , $state,$http,userService,blockUI,$dialog){
        var thisCtrl = this;
      
         $scope.init = function(){
           
            console.log('AdminUserManagementUsersCreateController loaded!');
            $http.post("/api/admin/user/getUserLayoutDetail", {})
            .success(function(response){
                if(!response.success){
                    $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                }
                else{
                    $stateParams.metadata=response.metadata
                    $state.current.params={};
                    $state.current.params.metadata = $stateParams.metadata;
                    $scope.template = 'views/client/layout/create.html';
                    $scope.hideHeader = true;
                    angular.extend(thisCtrl, $controller('ClientSectionLayoutController', {$scope: $scope, $stateParams: $stateParams}));
                    $scope.saveOld = $scope.save;
                    $scope.save = function(){
                        var rtn=$scope.saveValidation(function(rtn){
                            if(rtn!=undefined && rtn !=null && rtn.message!=undefined && rtn.message!=="" ){
                                $dialog.alert(rtn.message,'Error','pficon pficon-error-circle-o');
                                return;
                            }
                            var username="";
                            var emailFieldVal="";
                            angular.forEach($scope.metadata.layoutSections,function(section,sectionIndex){
                                if(!section.isComponent){
                                    if(section.readonly === false && section.rendered === true){
                                        angular.forEach(section.columns,function(fields, columnIndex){
                                            angular.forEach(fields,function(field,fieldIndex){
                                                if(field.SObjectField.custom === true && field.readonly === false && field.enable === true && field.rendered != undefined && field.rendered === true
                                                    && field.SObjectField.name.indexOf('User_Name__c') !== -1){
                                                    username = field.value;
                                                }
                                                if(field.SObjectField.custom === true && field.readonly === false && field.enable === true && field.rendered != undefined && field.rendered === true
                                                    && field.SObjectField.name.indexOf('Email__c') !== -1){
                                                    emailFieldVal = field.value;
                                                }
                                            });
                                        });
                                    }
                                }
                            });
                            if(!(emailFieldVal === undefined || emailFieldVal==null || emailFieldVal.trim()==""
                                || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailFieldVal))){
                                $dialog.alert("Please Enter Valid Email Address",'Error','pficon pficon-error-circle-o');
                                return;
                            }
                            if(!(username === undefined || username==null || username.trim()=="")){
                                if($stateParams.metadata.isMobileActive ===true && !$scope.blockUI.layoutBlock.state().blocking){
                                    $scope.blockUI.layoutBlock.start('Checking User Exist...');
                                    userService.checkUserExist({username:username})
                                        .success(function(response){
                                            $scope.blockUI.layoutBlock.stop();
                                            if(response.success){
                                                $scope.finalSave(rtn);
                                            }else{
                                                $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                                            }
                                        })
                                        .error(function(response){
                                            $dialog.alert('Error occured while loading users.','Error','pficon pficon-error-circle-o');
                                            
                                        });
                                }
                                else{
                                    $scope.finalSave(rtn);
                                }
                            }
                            else{
                                $scope.finalSave(rtn);
                            }
                        });
                    }
                }
                
            })
            .error(function(){
                componentBlock.stop();
                $dialog.alert('Server error occured while loading details.','Error','pficon pficon-error-circle-o');
            });
            
        };

        $scope.init();

        
    }
]);
admin.controller('AdminUserManagementUsersEditController',[
            '$scope','$rootScope','$controller','$stateParams','$state','$http','userService','blockUI','$dialog',
    function($scope , $rootScope , $controller , $stateParams , $state,$http,userService,blockUI,$dialog){
        var thisCtrl = this;
      
         $scope.init = function(){
           
            console.log('AdminUserManagementUsersEditController loaded!');
            $http.post("/api/admin/user/getUserLayoutDetail", {type:'Edit'})
            .success(function(response){
                if(!response.success){
                    $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                }
                else{
                    $stateParams.metadata=response.metadata
                     $stateParams.data = {};
                     $state.current.params={};
                    $state.current.params.metadata = $stateParams.metadata;
                    var userData=$stateParams.userData;
                    var oldUsername=$stateParams.userData.username;
                    $scope.template = 'views/client/layout/edit.html';
                    $stateParams.data['record'] = {
                        Id: userData.id,
                        // Name: $rootScope.user().userdata.Name,
                        attributes: {
                            type: $stateParams.metadata.sobject.name,
                            url: "/services/data/v37.0/sobjects/"+$stateParams.metadata.sobject.name+"/"+userData.id
                        }
                    };
                    $scope.hideHeader = true;
                    angular.extend(thisCtrl, $controller('ClientSectionLayoutController', {$scope: $scope, $stateParams: $stateParams}));
                    $scope.saveOld = $scope.save;
                    $scope.save = function(){
                        var rtn=$scope.saveValidation(function(rtn){
                            if(rtn!=undefined && rtn !=null && rtn.message!=undefined && rtn.message!=="" ){
                                $dialog.alert(rtn.message,'Error','pficon pficon-error-circle-o');
                                return;
                            }
                            var username="";
                            var emailFieldVal="";
                            angular.forEach($scope.metadata.layoutSections,function(section,sectionIndex){
                                if(!section.isComponent){
                                    if(section.readonly === false && section.rendered === true){
                                        angular.forEach(section.columns,function(fields, columnIndex){
                                            angular.forEach(fields,function(field,fieldIndex){
                                                if(field.SObjectField.custom === true && field.readonly === false && field.enable === true && field.rendered != undefined && field.rendered === true
                                                    && field.SObjectField.name.indexOf('User_Name__c') !== -1){
                                                    username = field.value;
                                                }
                                                if(field.SObjectField.custom === true && field.readonly === false && field.enable === true && field.rendered != undefined && field.rendered === true
                                                    && field.SObjectField.name.indexOf('Email__c') !== -1){
                                                    emailFieldVal = field.value;
                                                }
                                            });
                                        });
                                    }
                                }
                            });
                            if(!(emailFieldVal === undefined || emailFieldVal==null || emailFieldVal.trim()==""
                                || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailFieldVal))){
                                $dialog.alert("Please Enter Valid Email Address",'Error','pficon pficon-error-circle-o');
                                return;
                            }
                            if(!(username === undefined || username==null || username.trim()=="")){
                                if($stateParams.metadata.isMobileActive ===true && oldUsername!=username && !$scope.blockUI.layoutBlock.state().blocking){
                                    $scope.blockUI.layoutBlock.start('Checking User Exist...');
                                    userService.checkUserExist({username:username})
                                        .success(function(response){
                                            $scope.blockUI.layoutBlock.stop();
                                            if(response.success){
                                                $scope.finalSave(rtn);
                                            }else{
                                                $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                                            }
                                        })
                                        .error(function(response){
                                            $dialog.alert('Error occured while loading users.','Error','pficon pficon-error-circle-o');
                                            
                                        });
                                }
                                else{
                                    $scope.finalSave(rtn);
                                }
                            }
                            else{
                                $scope.finalSave(rtn);
                            }
                        });
                    }
                }
                
            })
            .error(function(){
                componentBlock.stop();
                $dialog.alert('Server error occured while loading details.','Error','pficon pficon-error-circle-o');
            });
            
        };

        $scope.init();
        
    }
]);
