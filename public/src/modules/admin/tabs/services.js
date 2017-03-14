'use strict';

admin.factory('tabService',['$http',function($http){
    return {
        loadTabs: function(body){
            return $http.post('/api/admin/tab/list',body);
        },
        saveTab: function(tab){
            return $http.post('/api/admin/tab/save',tab);
        },
        deleteTab: function(tab){
            return $http.post('/api/admin/tab/delete',tab);
        }
    };
}]);