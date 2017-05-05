'use strict';

admin.factory('sobjectService',['$http',function($http){
    return {
        loadSObjects: function(body){
            return $http.post('/api/admin/sobject/list',body);
        },
        newSObject: function(sObject){
            return $http.post('/api/admin/sobject/new',sObject);
        },
        deleteSObject: function(sObject){
            var sObjectToDelete = angular.copy(sObject);
            delete sObjectToDelete.SObjectFields;
            return $http.post('/api/admin/sobject/delete',sObjectToDelete);
        },
        loadSObjectFields: function(sObject){
            return $http.post('/api/admin/sobjectfield/list',sObject);
        },
        loadChildSObjects: function(sObject){
            return $http.post('/api/admin/sobject/childobjects',sObject);
        },
        syncSObjects: function(sobjectList){
            return $http.post('/api/admin/sobject/sync',sobjectList);
        }
    };
}]);