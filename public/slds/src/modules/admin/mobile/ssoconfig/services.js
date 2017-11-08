'use strict';

admin.factory('mobileSSOConfigService',['$http',function($http){
    return {
        loadSSOConfiguration: function(body){
            return $http.post('/api/admin/mobilesso/ssoconfig',body);
        },
        saveSSOConfiguration: function(ssoconfig){
            return $http.post('/api/admin/mobilesso/ssoconfig/save',ssoconfig);
        },
    };
}]);