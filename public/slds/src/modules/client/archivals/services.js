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
    };
}]);