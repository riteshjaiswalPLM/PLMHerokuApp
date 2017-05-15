'use strict';

admin.factory('mobileOrgDetailService',['$http',function($http){
    return {
        loadOrgDetail: function(body){
            return $http.post('/api/admin/orgdetails/list',body);
        },
        saveOrgDetail: function(orgDetail){
            return $http.post('/api/admin/orgdetails/save', orgDetail);
        }
        
    };
}]);