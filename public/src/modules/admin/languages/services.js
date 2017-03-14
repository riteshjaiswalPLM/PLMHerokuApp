'use strict';

admin.factory('languageService',['$http',function($http){
    return {
        loadLanguages: function(body){
            return $http.post('/api/admin/language/list',body);
        },
        changeActive: function(language){
            return $http.post('/api/admin/language/changeactive',language);
        },
        markAsDefault: function(layout){
            return $http.post('/api/admin/language/markasdefault',layout);
        },
        saveLanguage: function(language){
            return $http.post('/api/admin/language/save',language);
        },
        deleteLanguage: function(language){
            return $http.post('/api/admin/language/delete',language);
        },
        viewLanguageDetails: function (language) {
            return $http.post('/api/admin/language/languagedetail',language);
        },
        exportLanguageTranslation: function (language) {
            return $http.post('/api/admin/language/exportlanguagetranslation',language);
        },
        importLanguageTranslation: function (language) {
            return $http.post('/api/admin/language/importlanguagetranslation',language);
        },
        automateLanguageTranslation: function (language) {
            return $http.post('/api/admin/language/automatelanguagetranslation',language);
        }
    };
}]);