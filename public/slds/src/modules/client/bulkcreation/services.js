'use strict';

client.factory('bulkUploadService', ['$http', function ($http) {
    return {
        getUploadHistory: function () {
            return $http.post('/api/service/sobjectbulkcreation/getUploadHistory');
        },
        getFile: function (id) {
            return $http.post('/api/service/sobjectbulkcreation/createFile', id);
        },
        uploadRecords: function (reqData) {
            return $http.post('/api/service/sobjectbulkcreation/save', reqData);
        },
        getSelectedFields: function (fields) {
            return $http.post('/api/service/sobjectbulkcreation/getSelectedFields', fields);
        }
    };
}]);