'use strict';

client.factory('clientSObjectService',['$http','CriteriaHelper',function($http, CriteriaHelper){
    return {
        search: function(queryObject){
            return $http.post('/api/service/sobject/search', queryObject);
        },
        export: function (queryObject) {
            return $http.post('/api/service/sobject/export', queryObject);
        },
        getfiledata: function (req, res) {
            return $http.post('/api/service/sobject/getfiledata', req, res);
        },
        deletefile: function (file) {
            return $http.post('/api/service/sobject/deletefile', file);
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
                    var requiredCriteria;
                    if(field.requiredCriteria === null || field.requiredCriteria === undefined){
                        requiredCriteria = true;
                    }
                    else{
                        requiredCriteria = CriteriaHelper.validate(field.requiredCriteria,queryObject.allSObjectData);
                    }
                    if(datakey===field.SObjectField.name && field.required && requiredCriteria){
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