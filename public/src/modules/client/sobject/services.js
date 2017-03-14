'use strict';

client.factory('clientSObjectService',['$http',function($http){
    return {
        search: function(queryObject){
            return $http.post('/api/service/sobject/search', queryObject);
        },
        details: function(queryObject){
            return $http.post('/api/service/sobject/details', queryObject);
        },
        save: function(queryObject){
            return $http.post('/api/service/sobject/save', queryObject);
        },
        isRequireValidation: function(queryObject,callback){
            var sObjectData=queryObject.sObjectData;
            var fields =queryObject.fields
            var message="";
            angular.forEach(sObjectData,function(data, datakey){
                angular.forEach(fields,function(field, fieldkey){
                    if(datakey===field.SObjectField.name && field.required){
                        if(field.SObjectField.type==="picklist"){
                            var found=false;
                            angular.forEach(field.SObjectField.picklistValues,function(picklstValue, picklstkey){
                                if(data===picklstValue.value){
                                    found=true;
                                }
                            });
                            if(!found){
                                message+=field.label + " must be required.<br>";    
                            }
                        }
                        else if(data===undefined || data==null || ( (typeof data)==="string" && data.trim()==="")){
                            message+=field.label + " must be required.<br>";
                        }
                        
                    }
                });
            });
            if(message===""){
                callback({
                    success: true,
                    message: 'Success'
                });
            }
            else{
                callback({
                    success: false,
                    message: message
                });
            }
            
        }
    };
}]);