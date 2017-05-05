'use strict';

client.factory('DashboardService',['$http',function($http){
    return {
        getDashboardComponentMetadata: function(data){
            if(data === undefined){
                data={};
            }
            data.slds = true;
            return $http.post('/api/service/dashboard/getdashboardcomponentmetadata',data);
        },
        loadData: function(data){
            return $http.post('/api/service/dashboard/loadData',data);
        }
    };
}]);