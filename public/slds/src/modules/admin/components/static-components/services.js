'use strict';

admin.factory('staticComponentService',['$http',function($http){
    return {
        loadComponent: function(){
            return $http.post('/api/admin/component/static/list');
        },
        saveComponent: function(component){
            return $http.post('/api/admin/component/static/save',component);
        },
        getComponentsForSObject: function(sObject){
            return $http.post('/api/admin/component/static/getcomponentsforsobject',sObject);
        }
    };
}]);