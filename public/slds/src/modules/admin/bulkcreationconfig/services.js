'use strict';

admin.factory('CSVUploadConfigService', ['$http', function ($http) {
    return {
        getFieldMapping: function () {
            return $http.post('/api/admin/bulkuploadconfig/getfieldmapping');
        },
        saveFieldMapping: function (config) {
            angular.forEach(config.configs, function (field, index) {
                if (field.SObjectField !== undefined && field.SObjectField !== null) {
                    delete field.SObjectField;
                }
            });

            return $http.post('/api/admin/bulkuploadconfig/savefieldmapping', config);
        }
    };
}]);