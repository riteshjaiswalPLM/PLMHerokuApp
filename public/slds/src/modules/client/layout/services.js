'use strict';

client.factory('clientLayoutService',['$http',function($http){
    return {
        metadata: function(data){
            data.slds = true;
            return $http.post('/api/service/layout/metadata',data);
        },
        sobjectMetadata: function(data){
            data.slds = true;
            return $http.post('/api/service/layout/sobjectMetadata',data);
        }
    };
}]);