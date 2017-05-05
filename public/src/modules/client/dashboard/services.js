'use strict';

client.factory('DashboardService',['$http',function($http){
    return {
        getDashboardComponentMetadata: function(data){
            return $http.post('/api/service/dashboard/getdashboardcomponentmetadata',data);
        },
        loadData: function(data){
            return $http.post('/api/service/dashboard/loadData',data);
        }
    };
}]);