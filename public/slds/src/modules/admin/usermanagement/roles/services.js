'use strict';

admin.factory('roleService',['$http',function($http){
    return {
        loadUserRoles: function(body){
            return $http.post('/api/admin/role/list',body);
        },
        saveUserRole: function(role, isNewRole){
            if(isNewRole){
                return $http.post('/api/admin/role/create',role);
            }else{
                return $http.post('/api/admin/role/update',role);    
            }
        },
        deleteRole: function(role){
            return $http.post('/api/admin/role/delete',role);
        },
    };
}]);