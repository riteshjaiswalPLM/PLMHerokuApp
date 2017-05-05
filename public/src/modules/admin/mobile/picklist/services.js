'use strict';

admin.factory('mobilePicklistService', ['$http', function ($http) {
    return {
        loadSObjects: function (body) {
            return $http.post('/api/admin/sobject/list', body);
        },
        loadSObjectFields: function (sObject) {
            return $http.post('/api/admin/sobjectfield/list', sObject);
        },
        loadPicklistDetail: function (picklistDetail) {
            return $http.post('/api/admin/dependentpicklist/list', picklistDetail);
        },
        savePicklistDetail: function (picklistDetail) {
            return $http.post('/api/admin/dependentpicklist/save', picklistDetail);
        },
        deletePicklistDetail: function (picklistDetail) {
            return $http.post('/api/admin/dependentpicklist/delete', picklistDetail);
        },
        loadPicklistChildDetail: function (picklistDetail) {
            return $http.post('/api/admin/dependentpicklist/childfieldvalue', picklistDetail);
        },
        saveChildPicklistDetail: function (data) {
            var fieldsToSave = [];

            angular.forEach(data.picklistChildDetail, function (field, index) {
                fieldsToSave.push({
                    userType: field.userType,
                    childfieldvalue: field.dependentValue,
                });
            });

            var listLayout = {
                fieldsToSave: fieldsToSave,
                picklistDetail: data.picklistDetail
            };
            return $http.post('/api/admin/dependentpicklist/savedependentchildvalue', listLayout);
        },
    };
}]);