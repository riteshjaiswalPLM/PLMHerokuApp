'use strict';

admin.factory('reportService', ['$http', function ($http) {
    return {
        showLookup: function () {
            return $http.post('/api/admin/sobjectreport/lookuplist');
        },
        loadReports: function () {
            return $http.post('/api/admin/sobjectreport/list');
        },
        createReport: function (report) {
            return $http.post('/api/admin/sobjectreport/create', report);
        },
        changeActive: function (report) {
            return $http.post('/api/admin/sobjectreport/changeactive', report);
        },
        deleteReport: function (report) {
            return $http.post('/api/admin/sobjectreport/delete', report);
        },
        loadListReportFields: function (report) {
            var newReport = angular.copy(report);
            delete newReport.SObject;
            return $http.post('/api/admin/sobjectreport/fields', newReport);
        },
        saveReport: function (searchCriteriaFields, searchRecordFields, sObjectReportId, sObjectReportWhereClause) {
            var _index = 0;
            angular.forEach(searchCriteriaFields, function (field, index) {
                if (field.ControllerSObjectField !== undefined && field.ControllerSObjectField !== null) {
                    delete field.ControllerSObjectField;
                }
                if (!field.deleted) {
                    field.order = _index;
                    _index++;
                }
            });
            _index = 0;
            angular.forEach(searchRecordFields, function (field, index) {
                if (field.ControllerSObjectField !== undefined && field.ControllerSObjectField !== null) {
                    delete field.ControllerSObjectField;
                }
                if (!field.deleted) {
                    field.order = _index;
                    _index++;
                }
            });
            var listReport = {
                searchCriteriaFields: searchCriteriaFields,
                searchRecordFields: searchRecordFields,
                sObjectReportId: sObjectReportId,
                sObjectReportWhereClause: sObjectReportWhereClause
            };
            return $http.post('/api/admin/sobjectreport/saveReport', listReport);
        }
    };
}]);