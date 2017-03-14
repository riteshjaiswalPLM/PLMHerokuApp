'use strict';

admin.factory('mobileGovernFieldsService',['$http',function($http){
    return {
        loadSObjects: function(body){
            return $http.post('/api/admin/sobject/list',body);
        },
        updateSObjectFields: function(sObjectFields){
            return $http.post('/api/admin/sobjectfield/updateIsGovernField',sObjectFields);
        },
        loadSObjectFields: function(sObject){
            return $http.post('/api/admin/sobjectfield/list',sObject);
        }
    };
}]);