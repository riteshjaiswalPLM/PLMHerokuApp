'use strict';

admin.factory('mobileUserActionService', ['$http', function ($http) {
    return {
        loadSObjects: function (body) {
            return $http.post('/api/admin/sobject/list', body);
        },
        loadSObjectFields: function (sObject) {
            return $http.post('/api/admin/sobjectfield/list', sObject);
        },
        loadUserAction: function (userAction) {
            return $http.post('/api/admin/useraction/list', userAction);
        },
        saveUserAction: function (userAction) {
            return $http.post('/api/admin/useraction/save', userAction);
        },
        deleteUserAction: function (userAction) {
            return $http.post('/api/admin/useraction/delete', userAction);
        },
        loadUserActionFields: function (layout) {
            var newLayout = angular.copy(layout);
            delete newLayout.SObject;
            return $http.post('/api/admin/useraction/fields', newLayout);
        },
        saveUserActionFields: function (data) {
            var fieldsToSave = [];

            angular.forEach(data.actionFields, function (field, index) {
                fieldsToSave.push({
                    SObjectFieldId: field.SObjectField.id,
                    readonly: field.readonly,
                    required: field.required,
                    optional: field.optional,
                });
            });

            var listLayout = {
                fieldsToSave: fieldsToSave,
                userAction: data.userAction
            };
            return $http.post('/api/admin/useraction/saveuseractionfields', listLayout);
        },
    };
}]);