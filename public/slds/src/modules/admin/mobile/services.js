'use strict';

admin.factory('mobileSobjectService',['$http',function($http){
    return {
        loadSObjects: function(body){
            return $http.post('/api/admin/sobject/list',body);
        },
        updateSObject: function(sObject){
            return $http.post('/api/admin/sobject/updateForMobile',sObject);
        },
        updateSObjectFields: function(sObjectFields){
            return $http.post('/api/admin/sobjectfield/updateForMobile',sObjectFields);
        },
        loadSObjectFields: function(sObject){
            return $http.post('/api/admin/sobjectfield/list',sObject);
        },
        loadChildSObjects: function(sObject){
            return $http.post('/api/admin/sobject/childobjects',sObject);
        },
        loadMobileConfig: function(){
            return $http.post('/api/admin/mobileconfig/configJSON',null);
        },
        syncWithMiddleware: function(){
            return $http.post('/api/admin/mobileconfig/syncwithmiddleware');
        }
    };
}]);