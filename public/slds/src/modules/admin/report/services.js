'use strict';

admin.factory('reportService', ['$http', function ($http) {
    return {
        sObjectList: function () {
            return $http.post('/api/admin/sobjectreport/sObjectList');
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
        createReport: function (searchCriteriaFields, searchRecordFields, sObjectReport, sObjectReportName, sObjectReportWhereClause) {
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
                sObjectReport: sObjectReport,
                sObjectReportName: sObjectReportName,
                sObjectReportWhereClause: sObjectReportWhereClause
            };
            return $http.post('/api/admin/sobjectreport/createReport', listReport);
        },
        editReport: function (searchCriteriaFields, searchRecordFields, sObjectReportId, sObjectReportName, sObjectReportWhereClause) {
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
                sObjectReportName: sObjectReportName,
                sObjectReportWhereClause: sObjectReportWhereClause
            };
            return $http.post('/api/admin/sobjectreport/editReport', listReport);
        }
    };
}]);