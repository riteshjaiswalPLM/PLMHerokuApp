'use strict';

client.factory('ClientProfileService',['$http',function($http){
    return {
        loadstaticlist: function(){
            return $http.post('/api/service/profile/loadstaticlist');
        },
        saveothersettings: function(data){
            return $http.post('/api/service/profile/saveothersettings', data);
        },
        changepassword: function(data){
            return $http.post('/api/service/profile/changepassword', data);
        }
    };
}]);