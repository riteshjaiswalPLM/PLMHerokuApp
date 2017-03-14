'use strict';

client.factory('clientLayoutService',['$http',function($http){
    return {
        metadata: function(data){
            return $http.post('/api/service/layout/metadata',data);
        }
    };
}]);