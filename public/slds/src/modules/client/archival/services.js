'use strict';

client.factory('ArchivalService',['$http',function($http){
    return {
        getArchivedInvoices: function(data){
            return $http.post('/api/service/archived/invoices',data);
        },
        loadData: function(data){
            return $http.post('/api/service/dashboard/loadData',data);
        }
    };
}]);