'use strict';

client.factory('clientSObjectLookupService',['$http',function($http){
    return {
        metadata: function(data){
            return $http.post('/api/service/sobjectlookup/metadata',data);
        }
    };
}]);