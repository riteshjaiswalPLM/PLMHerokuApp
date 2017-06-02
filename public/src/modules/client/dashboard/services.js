'use strict';

client.factory('DashboardService',['$http',function($http){
    return {
        getDashboardComponentMetadata: function(data){
            return $http.post('/api/service/dashboard/getdashboardcomponentmetadata',data);
        },
        loadData: function(data){
            return $http.post('/api/service/dashboard/loadData',data);
        },
        exportData: function (data) {
            return $http.post('/api/service/dashboard/exportData', data);
        },
        getfiledata: function (req, res) {
            return $http.post('/api/service/dashboard/getfiledata', req, res);
        },
        deletefile: function (req, res) {
            return $http.post('/api/service/dashboard/deletefile', req, res);
        }
    };
}]);