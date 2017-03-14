'use strict';

admin.factory('sfdcService',['$http',function($http){
    return {
        describeSObjects: function(){
            return $http.post('/api/sfdc/describeSObjects');
        }  
    };
}]);