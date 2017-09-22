'use strict';

client.factory('clientArchivalService', ['$http', function ($http) {
    return {
        archivaltabs: function () {
            return $http.post('/api/service/archivals/archivaltabs');
        },
        loadLayout: function (sObjectLayouts) {
            return $http.post('/api/service/archivals/loadLayout', sObjectLayouts);
        },
        search: function (queryObject) {
            return $http.post('/api/service/archivals/search', queryObject);
        },
        metadata: function(data){
            data.slds = true;
            return $http.post('/api/service/layout/metadata',data);
        },
        sobjectMetadata: function(data){
            data.slds = true;
            return $http.post('/api/service/layout/sobjectMetadata',data);
        },
        sobjectDetaildata: function(data){
            data.slds = true;
            return $http.post('/api/service/layout/sobjectDetaildata',data);
        },
        details: function(queryObject){
            return $http.post('/api/service/archivals/details', queryObject);
        },
        getConfigdata: function(data){
            return $http.post('/api/service/archivals/getConfigdata', data);
        },
        searchDetails: function(data){
            return $http.post('/api/service/archivals/searchDetails', data);
        }
    };
}]);