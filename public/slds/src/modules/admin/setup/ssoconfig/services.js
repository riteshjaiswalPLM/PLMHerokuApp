'use strict';

admin.factory('ssoConfigService',['$http',function($http){
    return {
        loadSSOConfiguration: function(body){
            return $http.post('/api/admin/setup/ssoconfig',body);
        },
        saveSSOConfiguration: function(ssoconfig){
            return $http.post('/api/admin/setup/ssoconfig/save',ssoconfig);
        },
        loadUserTableColumn: function(){
            return $http.post('/api/admin/setup/ssoconfig/getuserobjectfields');
        }
    };
}]);