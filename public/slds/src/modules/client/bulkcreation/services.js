'use strict';

client.factory('bulkUploadService', ['$http', function ($http) {
    return {
        uploadRecords: function (reqData) {
            return $http.post('/api/service/sobjectbulkcreation/save', reqData);
        }
    };
}]);