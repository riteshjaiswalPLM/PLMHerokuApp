'use strict';

admin.factory('setupService',['$http',function($http){
    return {
        loadSalesforceConfiguration: function(body){
            return $http.post('/api/admin/setup/sfdc',body);
        },
        saveSalesforceConfiguration: function(sfdcConfig){
            return $http.post('/api/admin/setup/sfdc/save',sfdcConfig);
        },
        RemoveSalesforceConfiguration: function(body){
            return $http.post('/api/admin/setup/sfdc/remove',body);
        }
    };
}]);