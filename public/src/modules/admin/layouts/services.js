'use strict';

admin.factory('layoutService',['$http',function($http){
    return {
        loadLayouts: function(body){
            return $http.post('/api/admin/sobjectlayout/list',body);
        },
        loadListLayoutFields: function(layout){
            var newLayout = angular.copy(layout);
            delete newLayout.SObject;
            return $http.post('/api/admin/sobjectlayout/fields', newLayout);
        },
        loadEditLayoutContents: function(layout){
            var newLayout = angular.copy(layout);
            delete newLayout.SObject;
            return $http.post('/api/admin/sobjectlayout/contents', newLayout);
        },
        loadLayoutRelatedLists: function(layout){
            var newLayout = angular.copy(layout);
            delete newLayout.SObject;
            return $http.post('/api/admin/sobjectlayout/relatedlists', newLayout);
        },
        createLayout: function(layout){
            return $http.post('/api/admin/sobjectlayout/create',layout);
        },
        deleteLayout: function(layout){
            return $http.post('/api/admin/sobjectlayout/delete',layout);
        },
        markAsDefault: function(layout){
            return $http.post('/api/admin/sobjectlayout/markasdefault',layout);
        },
        changeActive: function(layout){
            return $http.post('/api/admin/sobjectlayout/changeactive',layout);
        },
        saveListLayout: function(searchCriteriaFields,searchRecordFields,actionButtonCriteria,sObjectLayoutId,sObjectLayoutWhereClause){
            // var fieldsToDelete = [];
            var _index = 0;
            angular.forEach(searchCriteriaFields,function(field,index){
                if(field.ControllerSObjectField !== undefined && field.ControllerSObjectField !== null){
                    field.ControllerSObjectFieldId = field.ControllerSObjectField.id;
                    delete field.ControllerSObjectField;
                }
                if(!field.deleted){
                    field.order = _index;
                    _index++;
                }
            });
            _index = 0;
            angular.forEach(searchRecordFields,function(field,index){
                if(field.ControllerSObjectField !== undefined && field.ControllerSObjectField !== null){
                    field.ControllerSObjectFieldId = field.ControllerSObjectField.id;
                    delete field.ControllerSObjectField;
                }
                if(!field.deleted){
                    field.order = _index;
                    _index++;
                }
            });
            var listLayout = {
                searchCriteriaFields: searchCriteriaFields,
                searchRecordFields: searchRecordFields,
                actionButtonCriteria : actionButtonCriteria,
                sObjectLayoutId: sObjectLayoutId,
                sObjectLayoutWhereClause: sObjectLayoutWhereClause
            };
            return $http.post('/api/admin/sobjectlayout/savelistlayout',listLayout);
        },
        saveEditLayout: function(editLayout){
            var sectionOrder = 0;
            angular.forEach(editLayout.layoutSections,function(section,sectionIndex){
                if(!section.deleted){
                    section.order = sectionOrder;
                    sectionOrder++;
                    
                    if(!section.isComponent){
                        angular.forEach(section.columns,function(fields){
                            var fieldOrder = 0;
                            angular.forEach(fields,function(field,fieldIndex){
                                if(field.ControllerSObjectField !== undefined && field.ControllerSObjectField !== null){
                                    field.ControllerSObjectFieldId = field.ControllerSObjectField.id;
                                    delete field.ControllerSObjectField;
                                }
                                
                                // if(field.lookup !== undefined && field.lookup.value !== undefined){
                                //     field.SObjectLookupId = field.lookup.value;
                                // }else{
                                //     delete field.SObjectLookupId;
                                // }
                                field.SObjectLookupId = (field.lookup !== undefined && field.lookup.value !== undefined) ? field.lookup.value : field.SObjectLookupId; 
                                delete field.lookup;
                                if(!field.deleted){
                                    field.order = fieldOrder;
                                    fieldOrder++;
                                }
                            });
                        });
                         angular.forEach(section.deletedFields,function(fields){
                            section.columns[0].push(fields);
                        }); 
                    }
                    else{
                        
                    }
                }
            });
            return $http.post('/api/admin/sobjectlayout/saveeditlayout',editLayout);
        },
        saveLayoutRelatedLists: function(editLayout){
            var relatedListOrder = 0;
            var layout = angular.copy(editLayout);
            angular.forEach(layout.relatedLists, function(relatedList, relatedListIndex){
                if(!relatedList.deleted){
                    relatedList.SObjectId = relatedList.SObject.id,
                    relatedList.order = relatedListOrder;
                    relatedListOrder++;
                    
                    var fieldOrder = 0;
                    angular.forEach(relatedList.SObjectLayoutFields, function(field, fieldIndex){
                        if(field.ControllerSObjectField !== undefined && field.ControllerSObjectField !== null){
                            field.ControllerSObjectFieldId = field.ControllerSObjectField.id;
                            delete field.ControllerSObjectField;
                        }
                        field.order = fieldOrder;
                        fieldOrder++;
                    });
                    delete relatedList.SObject;
                }
            });
            return $http.post('/api/admin/sobjectlayout/saveeditlayoutrelatedlists',layout);
        },
        getuserprofilelayout: function(layout){
            return $http.post('/api/admin/sobjectlayout/getuserprofilelayout',layout);
        }
    };
}]);