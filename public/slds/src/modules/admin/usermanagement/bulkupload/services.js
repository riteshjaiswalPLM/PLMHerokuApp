'use strict';

admin.factory('userUploadService', ['$http', function ($http) {
    return {
        getUploadHistory: function () {
            return $http.post('/api/admin/userconfig/getUploadHistory');
        },
        uploadUsers: function (upload) {
            return $http.post('/api/admin/userconfig/uploadUsers', upload);
        },
        getFile: function (id) {
            return $http.post('/api/admin/userconfig/createFile', id);
        },
        getfiledata: function (req, res) {
            return $http.post('/api/admin/userconfig/getFile', req, res);
        },
        deleteFile: function (req, res) {
            return $http.post('/api/admin/userconfig/deleteFile', req, res);
        }
    };
}]);