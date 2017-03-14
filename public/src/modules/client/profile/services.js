'use strict';

client.factory('ClientProfileService',['$http',function($http){
    return {
        languagelist: function(){
            return $http.post('/api/service/profile/languagelist');
        },
        saveothersettings: function(data){
            return $http.post('/api/service/profile/saveothersettings', data);
        },
        changepassword: function(data){
            return $http.post('/api/service/profile/changepassword', data);
        }
    };
}]);