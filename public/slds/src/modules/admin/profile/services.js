'use strict';

admin.factory('adminProfileService', ['$http', function ($http) {
    return {
        changepassword: function (data) {
            return $http.post('/api/admin/profile/changepassword', data);
        },
        changeemail: function (data) {
            return $http.post('/api/admin/profile/changeemail', data);
        }
    };
}]);