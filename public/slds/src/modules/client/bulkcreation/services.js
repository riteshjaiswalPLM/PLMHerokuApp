'use strict';

client.factory('invoiceUploadService', ['$http', function ($http) {
    return {
        getUploadHistory: function () {
            return $http.post('/api/admin/userconfig/getUploadHistory');
        },
        uploadInvoices: function (upload) {
            //return $http.post('/api/admin/userconfig/uploadUsers', upload);
            //return $http.post('/api/admin/userconfig/uploadUsersInSync', upload);
            //return $http.post('/api/service/sobjectbulkcreation/uploadInvoices', upload);
            return $http.post('/api/service/sobjectbulkcreation/save', upload);
        },
        getFile: function (id) {
            return $http.post('/api/admin/userconfig/createFile', id);
        },
        getfiledata: function (req, res) {
            return $http.post('/api/admin/userconfig/getFile', req, res);
        },
        save: function () {
            return $http.post('/api/service/sobjectbulkcreation/save');
        },
        deleteFile: function (req, res) {
            return $http.post('/api/admin/userconfig/deleteFile', req, res);
        }

    };
}]);