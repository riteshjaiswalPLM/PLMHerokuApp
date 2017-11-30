'use strict';

admin.factory('tabConfigService', ['$http', function ($http) {
    return {
        fetchConfig: function () {
            return $http.post('/api/admin/tabconfig/fetchConfig');
        },
        save: function (data) {
            return $http.post('/api/admin/tabconfig/save', data);
        }
    };
}]);