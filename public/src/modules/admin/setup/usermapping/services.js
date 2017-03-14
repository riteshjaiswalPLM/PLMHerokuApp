'use strict';

admin.factory('userMappingService',['$http',function($http){
    return {
        loadUserMappingConfiguration: function(body){
            return $http.post('/api/admin/setup/usermapping',body);
        },
        saveUserMappingConfiguration: function(userMapping){
            var cloneUserMapping = angular.copy(userMapping);
            delete cloneUserMapping.SObject.SObjectFields;
            return $http.post('/api/admin/setup/usermapping/save',cloneUserMapping);
        }
    };
}]);