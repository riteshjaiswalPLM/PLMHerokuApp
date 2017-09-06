'use strict';

admin.factory('setupService',['$http',function($http){
    return {
        loadSalesforceConfiguration: function(body){
            return $http.post('/api/admin/setup/sfdc',body);
        },
        getUsername: function (userid) {
            return $http.post('/api/admin/setup/getUsername', userid);
        },
        getPassword: function (userid) {
            return $http.post('/api/admin/setup/getPassword', userid);
        },
        getToken: function (userid) {
            return $http.post('/api/admin/setup/getToken', userid);
        },
        saveSalesforceConfiguration: function(sfdcConfig){
            return $http.post('/api/admin/setup/sfdc/save',sfdcConfig);
        },
        RemoveSalesforceConfiguration: function(body){
            return $http.post('/api/admin/setup/sfdc/remove',body);
        }
    };
}]);