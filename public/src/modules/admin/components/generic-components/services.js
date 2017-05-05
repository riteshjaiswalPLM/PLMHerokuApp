'use strict';

admin.factory('genericComponentService',['$http',function($http){
    return {
        loadComponent: function(){
            return $http.post('/api/admin/component/list');
        },
        deleteComponent: function(component){
            return $http.post('/api/admin/component/delete',component);
        },
        loadComponentDetails: function(component){
            return $http.post('/api/admin/component/details',component);
        },
        saveComponent: function(component){
            return $http.post('/api/admin/component/save',component);
        },
        getComponentsForSObject: function(sObject){
            return $http.post('/api/admin/component/getcomponentsforsobject',sObject);
        },
        loadDashboardComponent: function(data){
            return $http.post('/api/admin/component/dashboard/list', data);
        },
        loadRefSObject: function(data){
        	return $http.post('/api/admin/component/loadrefsobject', data);
        },
        getUserSObject: function(){
        	return $http.post('/api/admin/component/getusersobject');
        }
    };
}]);