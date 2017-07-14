'use strict';

auth.factory('clientReportService', [
    '$http',
    function ($http) {
        return {
            reporttabs: function () {
                return $http.post('/api/service/report/reporttabs');
            },
            loadReport: function (report) {
                return $http.post('/api/service/report/loadReport', report);
            },
            search: function (queryObject) {
                return $http.post('/api/service/report/search', queryObject);
            },
            export: function (queryObject) {
                return $http.post('/api/service/report/export', queryObject);
            },
            getfiledata: function (req, res) {
                return $http.post('/api/service/report/getfiledata', req, res);
            },
            deletefile: function (file) {
                return $http.post('/api/service/report/deletefile', file);
            }
        };
    }
]);