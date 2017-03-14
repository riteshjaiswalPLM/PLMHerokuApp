'use strict';

admin.factory('clientDashboardContainerService',['$http',function($http){
    return {
        loadClientDashboardContainers: function(){
            return $http.post('/api/admin/clientdashboard/contents');
        },
        saveClientDashboardContainers: function(data){
            return $http.post('/api/admin/clientdashboard/save', data);
        }
    };
}]);