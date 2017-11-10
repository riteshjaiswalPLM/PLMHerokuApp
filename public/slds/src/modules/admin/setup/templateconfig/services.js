'use strict';

admin.factory('templateConfigService',['$http',function($http){
    return {
        loadTemplates: function(body){
            return $http.post('/api/admin/templateConfig/list',body);
        },
        loadLanguages: function(body){
            return $http.post('/api/admin/language/list',body);
        },
        deleteTemplate: function(sTemplates){
            return $http.post('/api/admin/templateConfig/delete',sTemplates);
        },
        saveTemplate: function(sTemplates){
            return $http.post('/api/admin/templateConfig/save',sTemplates);
        }
    };
}]);