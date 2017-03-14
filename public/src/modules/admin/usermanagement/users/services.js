'use strict';

admin.factory('userService',['$http',function($http){
    return {
        loadUsers: function(body){
            return $http.post('/api/admin/user/list',body);
        },
        syncUsers: function(body){
            return $http.post('/api/admin/user/sync',body);
        },
        deleteUser: function(user){
            return $http.post('/api/admin/user/delete',user);
        },
    };
}]);