'use strict';

admin.factory('userConfigService', ['$http', function ($http) {
    return {
        getuserfields: function () {
            return $http.post('/api/admin/userconfig/getuserfields');
        },
        getmappedfields: function () {
            return $http.post('/api/admin/userconfig/getmappedfields');
        },
        saveuserconfig: function (config) {
            angular.forEach(config, function (field, index) {
                if (field.SObjectField !== undefined && field.SObjectField !== null) {
                    delete field.SObjectField;
                }
            });

            return $http.post('/api/admin/userconfig/saveuserconfig', config);
        }
    };
}]);