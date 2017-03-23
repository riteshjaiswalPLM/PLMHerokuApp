'use strict';

var adminLookup = angular.module('app.admin.lookups',[]);

adminLookup.controller('SObjectLookupController',[
            '$scope','$rootScope','$element','$dialog','sobjectService','blockUI','data','close',
    function($scope , $rootScope , $element , $dialog , sobjectService , blockUI , data , close){
        $scope.title = (data.title) ? data.title : 'Select sObject' ;
        $scope.criteria = (data.criteria) ? data.criteria : {};
        
        $scope.loadSObjects = function(){
            var blockUi = blockUI.instances.get('loadSObjects');
            if(!blockUi.state().blocking){
                blockUi.start('Loading local sobjects...');
                sobjectService.loadSObjects($scope.criteria)
                    .success(function(response){
                        blockUi.stop();
                        if(response.success){
                            $scope.sObjects = response.data.sObjects;
                        }else{
                            $scope.close();
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                    })
                    .error(function(response){
                        blockUi.stop();
                        $scope.close();
                        $dialog.alert('Error occured while loading local sobjects.','Error','pficon pficon-error-circle-o');
                    });
            }
        }
        
        $scope.close = function(){
            $element.modal('hide');
        };
        $scope.selectAndClose = function(sObject){
            $element.modal('hide');
            close(sObject, 500);
        }
        
        $scope.init = function(){
            $scope.loadSObjects();
        };
        $scope.init();
    }
]);

adminLookup.controller('SObjectLayoutLookupController',[
            '$scope','$rootScope','$element','$dialog','layoutService','blockUI','data','close',
    function($scope , $rootScope , $element , $dialog , layoutService , blockUI , data , close){
        $scope.title = (data.title) ? data.title : 'Select sObject layout' ;
        
        $scope.loadSObjectLayouts = function(){
            var blockUi = blockUI.instances.get('loadSObjectLayouts');
            if(!blockUi.state().blocking){
                blockUi.start('Loading local sobject layouts...');
                layoutService.loadLayouts({
                    criteria: data.criteria
                })
                .success(function(response){
                    blockUi.stop();
                    if(response.success){
                        $scope.sObjectLayouts = response.data.layouts;
                    }else{
                        $scope.close();
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                })
                .error(function(response){
                    blockUi.stop();
                    $scope.close();
                    $dialog.alert('Error occured while loading local sobjects layouts.','Error','pficon pficon-error-circle-o');
                });
            }
        }
        
        $scope.close = function(){
            $element.modal('hide');
        };
        $scope.selectAndClose = function(sObjectLayout){
            $element.modal('hide');
            close(sObjectLayout, 500);
        }
        
        $scope.init = function(){
            $scope.loadSObjectLayouts();
        };
        $scope.init();
    }
]);

adminLookup.controller('SObjectLookupsLookupController',[
            '$scope','$rootScope','$element','$dialog','lookupService','blockUI','data','close',
    function($scope , $rootScope , $element , $dialog , lookupService , blockUI , data , close){
        $scope.title = (data.title) ? data.title : 'Select sObject lookup' ;
        
        $scope.loadSObjectLookups = function(){
            var blockUi = blockUI.instances.get('loadSObjectLookups');
            if(!blockUi.state().blocking){
                blockUi.start('Loading sobject lookups...');
                lookupService.loadLookups({
                    criteria: data.criteria
                })
                .success(function(response){
                    blockUi.stop();
                    if(response.success){
                        $scope.sObjectLookups = response.data.sObjectLookups;
                    }else{
                        $scope.close();
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                })
                .error(function(response){
                    blockUi.stop();
                    $scope.close();
                    $dialog.alert('Error occured while loading sobjects lookups.','Error','pficon pficon-error-circle-o');
                });
            }
        }
        
        $scope.close = function(){
            $element.modal('hide');
        };
        $scope.selectAndClose = function(sObjectLookup){
            $element.modal('hide');
            close(sObjectLookup, 500);
        }
        
        $scope.init = function(){
            $scope.loadSObjectLookups();
        };
        $scope.init();
    }
]);

adminLookup.controller('TabLookupController',[
            '$scope','$rootScope','$element','$dialog','tabService','blockUI','data','close',
    function($scope , $rootScope , $element , $dialog , tabService , blockUI , data , close){
        $scope.title = (data.title) ? data.title : 'Select sObject for Tab' ;
        
        $scope.loadTabs = function(){
            var blockUi = blockUI.instances.get('loadTabs');
            if(!blockUi.state().blocking){
                blockUi.start('Loading local sobject tabs...');
                tabService.loadTabs({
                    criteria: data.criteria
                })
                .success(function(response){
                    blockUi.stop();
                    if(response.success){
                        $scope.tabs = response.data.tabs;
                    }else{
                        $scope.close();
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                })
                .error(function(response){
                    blockUi.stop();
                    $scope.close();
                    $dialog.alert('Error occured while loading local sobjects tabs.','Error','pficon pficon-error-circle-o');
                });
            }
        }
        
        $scope.close = function(){
            $element.modal('hide');
        };
        $scope.selectAndClose = function(tab){
            $element.modal('hide');
            close(tab, 500);
        }
        
        $scope.init = function(){
            $scope.loadTabs();
        };
        $scope.init();
    }
]);

adminLookup.controller('IconLookupController',[
            '$scope','$rootScope','$http','$timeout','$element','$dialog','blockUI','data','close',
    function($scope , $rootScope , $http , $timeout , $element , $dialog , blockUI , data , close){
        $scope.title = (data.title) ? data.title : 'Select an icon' ;
        
        $scope.loadIcons = function(){
            var blockUi = blockUI.instances.get('loadIcons');
            if(!blockUi.state().blocking){
                blockUi.start('Loading icons...');
                $http.post('/api/admin/icon/list',{slds: true})
                    .success(function(response){
                        blockUi.stop();
                        if(response.success){
                            $scope.icons = response.data.icons;
                        }else{
                            $scope.close();
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                    })
                    .error(function(response){
                        blockUi.stop();
                        $scope.close();
                        $dialog.alert('Error occured while loading icons.','Error','pficon pficon-error-circle-o');
                    });
            }
        }
        
        $scope.close = function(){
            $element.modal('hide');
        };
        $scope.selectAndClose = function(icon){
            $element.modal('hide');
            close(icon, 500);
        }
        
        $scope.init = function(){
            $timeout($scope.loadIcons,500);
        };
        $scope.init();
    }
]);

adminLookup.controller('RoleLookupController',[
            '$scope','$rootScope','$http','$timeout','$element','$dialog','blockUI','data','close',
    function($scope , $rootScope , $http , $timeout , $element , $dialog , blockUI , data , close){
        $scope.title = (data.title) ? data.title : 'Select role' ;
        
        $scope.loadRoles = function(){
            var blockUi = blockUI.instances.get('loadRoles');
            if(!blockUi.state().blocking){
                blockUi.start('Loading roles...');
                $http.post('/api/admin/role/list',{})
                    .success(function(response){
                        blockUi.stop();
                        if(response.success){
                            $scope.roles = response.data.roles;
                        }else{
                            $scope.close();
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                    })
                    .error(function(response){
                        blockUi.stop();
                        $scope.close();
                        $dialog.alert('Error occured while loading roles.','Error','pficon pficon-error-circle-o');
                    });
            }
        }
        
        $scope.close = function(){
            $element.modal('hide');
        };
        $scope.selectAndClose = function(role){
            $element.modal('hide');
            close(role, 500);
        }
        
        $scope.init = function(){
            $timeout($scope.loadRoles,500);
        };
        $scope.init();
    }
]);


adminLookup.controller('LanguageLookupController',[
            '$scope','$rootScope','$element','$dialog','languageService','blockUI','data','close',
    function($scope , $rootScope , $element , $dialog , languageService , blockUI , data , close){
        $scope.title = (data.title) ? data.title : 'Select Language' ;
        $scope.criteria = (data.criteria) ? data : {};
        
        $scope.loadLanguages = function(){
            var blockUi = blockUI.instances.get('loadLanguages');
            if(!blockUi.state().blocking){
                blockUi.start('Loading local languages...');
                languageService.loadLanguages($scope.criteria)
                    .success(function(response){
                        blockUi.stop();
                        if(response.success){
                            $scope.languages = response.data.languages;
                        }else{
                            $scope.close();
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                    })
                    .error(function(response){
                        blockUi.stop();
                        $scope.close();
                        $dialog.alert('Error occured while loading local languages.','Error','pficon pficon-error-circle-o');
                    });
            }
        }
        $scope.close = function(){
            $element.modal('hide');
        };
        $scope.selectAndClose = function(language){
            $element.modal('hide');
            close(language, 500);
        }
        $scope.init = function(){
            $scope.loadLanguages();
        };
        $scope.init();
    }
]);

adminLookup.factory('$adminLookups',['ModalService',function(ModalService){
    return {
        sObject: function(data, callback){
            ModalService.showModal({
                templateUrl: 'slds/views/admin/admin-lookups/sobject.html',
                controller:'SObjectLookupController',
                inputs:{
                    data: data  
                } 
            }).then(function(modal){
                modal.element.modal({backdrop: 'static', keyboard: false});
                modal.close.then(function(sObject){
                    callback && callback(sObject);
                });
            });
        },
        sObjectLayout: function(data, callback){
            ModalService.showModal({
                templateUrl: 'slds/views/admin/admin-lookups/sobjectlayout.html',
                controller:'SObjectLayoutLookupController',
                inputs:{
                    data: data  
                } 
            }).then(function(modal){
                modal.element.modal({backdrop: 'static', keyboard: false});
                modal.close.then(function(sObjectLayout){
                    callback && callback(sObjectLayout);
                });
            });
        },
        sObjectLookup: function(data, callback){
            ModalService.showModal({
                templateUrl: 'slds/views/admin/admin-lookups/sobjectlookup.html',
                controller:'SObjectLookupsLookupController',
                inputs:{
                    data: data  
                } 
            }).then(function(modal){
                modal.element.modal({backdrop: 'static', keyboard: false});
                modal.close.then(function(sObjectLookup){
                    callback && callback(sObjectLookup);
                });
            });
        },
        tab: function(data, callback){
            ModalService.showModal({
                templateUrl: 'slds/views/admin/admin-lookups/tab.html',
                controller:'TabLookupController',
                inputs:{
                    data: data  
                } 
            }).then(function(modal){
                modal.element.modal({backdrop: 'static', keyboard: false});
                modal.close.then(function(tab){
                    callback && callback(tab);
                });
            });
        },
        icon: function(data, callback){
            ModalService.showModal({
                templateUrl: 'slds/views/admin/admin-lookups/icon.html',
                controller:'IconLookupController',
                inputs:{
                    data: data  
                }
            }).then(function(modal){
                modal.element.modal({backdrop: 'static', keyboard: false});
                modal.close.then(function(icon){
                    callback && callback(icon);
                });
            });
        },
        role: function(data, callback){
            ModalService.showModal({
                templateUrl: 'slds/views/admin/admin-lookups/role.html',
                controller:'RoleLookupController',
                inputs:{
                    data: data  
                }
            }).then(function(modal){
                modal.element.modal({backdrop: 'static', keyboard: false});
                modal.close.then(function(role){
                    callback && callback(role);
                });
            });
        },
        language: function(data, callback){
            ModalService.showModal({
                templateUrl: 'slds/views/admin/admin-lookups/language.html',
                controller:'LanguageLookupController',
                inputs:{
                    data: data  
                }
            }).then(function(modal){
                modal.element.modal({backdrop: 'static', keyboard: false});
                modal.close.then(function(language){
                    callback && callback(language);
                });
            });
        }
    };
}]);