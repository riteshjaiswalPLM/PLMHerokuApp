'use strict';

admin.factory('lookupService',['$http',function($http){
    return {
        loadLookups: function(body){
            return $http.post('/api/admin/sobjectlookup/list',body);
        },
        loadLookupDetails: function(lookup){
            return $http.post('/api/admin/sobjectlookup/details',lookup);
        },
        saveLookup: function(lookup){
            return $http.post('/api/admin/sobjectlookup/save',lookup);
        },
        deleteLookup: function(lookup){
            return $http.post('/api/admin/sobjectlookup/delete',lookup);
        }
    };
}]);