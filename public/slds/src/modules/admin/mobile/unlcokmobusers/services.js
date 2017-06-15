'use strict';

admin.factory('unlockmobuserservice', ['$http', function ($http) {
    var baseURL = 'https://esm-mob-auth-v3.herokuapp.com';
     return {
        loadLockedMobUsers: function (body) {
            return $http.post(baseURL+'/api/mobusers/locked', body);
        },
        unlockMobUsers: function (body) {
            return $http.patch(baseURL+'/api/mobusers/', body);
        }

    }
}]);