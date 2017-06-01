'use strict';

var adminModals = angular.module('app.admin.modals',[]);

/**
 * Layout Section Properties modal
 */
adminLookup.factory('$adminModals',['ModalService',function(ModalService){
    return {
        layoutSectionProperties: function(data, callback){
            ModalService.showModal({
                templateUrl: 'slds/views/admin/admin-modals/layoutsectionproperties.html',
                controller:'LayoutSectionPropertiesModalController',
                inputs:{
                    data: data  
                } 
            }).then(function(modal){
                modal.element.modal({backdrop: 'static', keyboard: false});
                modal.close.then(function(section){
                    callback && callback(section);
                });
            });
        },
        relatedListProperties: function(data, callback){
            ModalService.showModal({
                templateUrl: 'slds/views/admin/admin-modals/layoutrelatedlistproperties.html',
                controller:'LayoutRelatedListPropertiesModalController',
                inputs:{
                    data: data  
                } 
            }).then(function(modal){
                modal.element.modal({backdrop: 'static', keyboard: false});
                modal.close.then(function(relatedList){
                    callback && callback(relatedList);
                });
            });
        },
        layoutFieldProperties: function(data, callback){
            ModalService.showModal({
                templateUrl: 'slds/views/admin/admin-modals/layoutfieldproperties.html',
                controller:'LayoutFieldPropertiesModalController',
                inputs:{
                    data: data  
                } 
            }).then(function(modal){
                modal.element.modal({backdrop: 'static', keyboard: false});
                modal.close.then(function(field){
                    callback && callback(field);
                });
            });
        },
        criteriaModal: function(data, callback){
            ModalService.showModal({
                templateUrl: 'slds/views/admin/admin-modals/criteriamodal.html',
                controller:'CriteriaModalController',
                inputs:{
                    data: data
                } 
            }).then(function(modal){
                modal.element.modal({backdrop: 'static', keyboard: false});
                modal.close.then(function(criteria){
                    callback && callback(criteria);
                });
            });
        },
        multiObjectCriteriaModal: function(data, callback){
            ModalService.showModal({
                templateUrl: 'slds/views/admin/admin-modals/multiobjectcriteriamodal.html',
                controller:'MultiObjectCriteriaModalController',
                inputs:{
                    data: data
                } 
            }).then(function(modal){
                modal.element.modal({backdrop: 'static', keyboard: false});
                modal.close.then(function(criteria){
                    callback && callback(criteria);
                });
            });
        },
        layoutFieldPropertiesPicklistValues: function(data, callback){
            ModalService.showModal({
                templateUrl: 'slds/views/admin/admin-modals/layoutfieldproperties_picklistvalues.html',
                controller:'LayoutFieldPropertiesPicklistValuesModalController',
                inputs:{
                    data: data  
                } 
            }).then(function(modal){
                modal.element.modal({backdrop: 'static', keyboard: false});
                modal.close.then(function(picklistValues){
                    callback && callback(picklistValues);
                });
            });
        },
        adminClientDashboardContainerProperties: function(data, callback){
            ModalService.showModal({
                templateUrl: 'slds/views/admin/admin-modals/dashboardcontainerproperties.html',
                controller:'AdminClientDashboardContainerPropertyModelController',
                inputs:{
                    data: data  
                } 
            }).then(function(modal){
                modal.element.modal({backdrop: 'static', keyboard: false});
                modal.close.then(function(container){
                    callback && callback(container);
                });
            });
        },
        adminClientDashboardContainerComponentProperties: function(data, callback){
            ModalService.showModal({
                templateUrl: 'slds/views/admin/admin-modals/dashboardcontainercomponentproperties.html',
                controller:'AdminClientDashboardContainerComponentPropertyModelController',
                inputs:{
                    data: data  
                } 
            }).then(function(modal){
                modal.element.modal({backdrop: 'static', keyboard: false});
                modal.close.then(function(container){
                    callback && callback(container);
                });
            });
        }
    };
}]).controller('LayoutSectionPropertiesModalController',[
            '$scope','$rootScope','$element','$dialog','blockUI','data','close',
    function($scope , $rootScope , $element , $dialog , blockUI , data , close){
        $scope.title = (data.title) ? data.title : 'Section Properties' ;
        $scope.layout = (data.layout) ? data.layout : {};
        $scope.section = (data.section) ? data.section : {};
        $scope.section.readonly =  $scope.section.readonly || $scope.layout.type === 'Details';
        $scope.sectionTitle = $scope.section.title;
        $scope.close = function(){
            $element.modal('hide');
        };
        $scope.save = function(){
            $scope.section.title = ($scope.section.title) ? $scope.section.title : $scope.sectionTitle;
            if($scope.section.readonly !== undefined){
                angular.forEach($scope.section.columns,function(fields){
                    angular.forEach(fields,function(field){
                        field.readonly = $scope.section.readonly;
                        field.required = false;
                    });
                });
            }
            $element.modal('hide');
            close($scope.section, 500);
        }
        
        $scope.init = function(){
            console.log('LayoutSectionPropertiesModalController loaded!');
        };
        $scope.init();
    }
]).controller('LayoutRelatedListPropertiesModalController',[
            '$scope','$rootScope','$element','$dialog','$timeout','blockUI','data','close','sobjectService',
    function($scope , $rootScope , $element , $dialog , $timeout , blockUI , data , close , sobjectService){
        $scope.title = (data.title) ? data.title : 'Related List Properties' ;
        $scope.layout = (data.layout) ? data.layout : {};
        $scope.forMobile = data.layout.type === 'Mobile' ? true : false;
        $scope.relatedList = (data.relatedList) ? data.relatedList : {};
        $scope.relatedList.readonly = $scope.relatedList.readonly|| $scope.layout.type === 'Details';
        $scope.relatedListTitle = $scope.relatedList.title;
        $scope.relatedListFields = ($scope.relatedList.SObjectLayoutFields) ? $scope.relatedList.SObjectLayoutFields : [];
        $scope.refSObjects = [];
        
        $scope.relativeFields = [];
        angular.forEach($scope.relatedList.SObject.SObjectFields, function(relativeField){
            if(relativeField.type === 'reference' && relativeField.referenceTo.indexOf($scope.layout.SObject.name) !== -1){
                $scope.relativeFields.push(relativeField);
            }
        });
        $scope.relatedList.SObjectField = ($scope.relatedList.SObjectField) ? $scope.relatedList.SObjectField : $scope.relativeFields[0]; 
        
        $scope.addToRelatedListFields = function(fieldToAdd){
            if(fieldToAdd){
                var duplicate = false;
                angular.forEach($scope.relatedListFields,function(field,fieldIndex){
                    if(field.SObjectField.type !== 'reference' && field.SObjectField.name === fieldToAdd.name && !duplicate && !field.deleted){
                        duplicate = true;
                    }
                    if(field.SObjectField.type === 'reference' && fieldToAdd.id === field.SObjectField.id && ((fieldToAdd.reference === undefined && field.reference === 'Name') || (fieldToAdd.reference !== undefined && field.reference === fieldToAdd.reference)) && !duplicate && !field.deleted){
                        duplicate = true;
                    }
                });
                if(!duplicate){
                    $scope.relatedListFields.push({
                        SObjectField: fieldToAdd,
                        label: fieldToAdd.label,
                        type: 'Related-List-Field',
                        hidden: false,
                        deleted: false,
                        readonly: $scope.relatedList.readonly
                    });
                }else{
                    $dialog.alert('Duplicate field!','Warning','pficon pficon-warning-triangle-o');
                }
            }
        };
        $scope.loadRefSObjects = function(){
            var referenceSObjectNames = [];
            var relatedListPropertiesModalBlockUi = blockUI.instances.get('relatedListPropertiesModalBlockUi');
            if(!relatedListPropertiesModalBlockUi.state().blocking){
                relatedListPropertiesModalBlockUi.start('Please wait...');
                angular.forEach($scope.relatedList.SObject.SObjectFields, function(field, fieldIndex){
                    if(field.type === 'reference'){
                        if(referenceSObjectNames.indexOf(field.referenceTo[0]) === -1){
                            referenceSObjectNames.push(field.referenceTo[0]);
                        }
                    }
                });
                var where = { referenceSObjectNames: referenceSObjectNames };
                if($scope.forMobile === true){
                    where.forMobile = true;
                }
                sobjectService.loadSObjects({ referenceSObjectNames: referenceSObjectNames })
                .success(function(response){
                    if(response.success === true){
                        angular.forEach(response.data.sObjects, function(sObject, sObjectIndex){
                            $scope.refSObjects[sObject.name] = sObject;
                        });
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        $scope.close();
                    }
                    relatedListPropertiesModalBlockUi.stop();
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading reference sObjects!','Error','pficon pficon-error-circle-o');
                    relatedListPropertiesModalBlockUi.stop();
                    $scope.close();
                });
            }
        };
        $scope.onChangeReadonlySwitch = function(){
            if($scope.relatedList.readonly === true){
                $scope.relatedList.requireAddMore = false;
                $scope.relatedListFields.forEach(function(field){
                    field.readonly = true;
                    field.required = false;
                });
            }
        }
        $scope.close = function(){
            $element.modal('hide');
        };
        $scope.save = function(){
            if($scope.forMobile === true && $scope.relatedListFields.length === 0){
                $dialog.alert('Please add fields.\nNo fields added.','Warning','pficon pficon-warning-triangle-o');
                return;
            }
            $scope.relatedList.title = ($scope.relatedList.title) ? $scope.relatedList.title : $scope.relatedListTitle;
            $scope.relatedList.SObjectLayoutFields = $scope.relatedListFields;
            $scope.relatedList.SObjectFieldId = $scope.relatedList.SObjectField.id;
            
            $element.modal('hide');
            close($scope.relatedList, 500);
        }

        $scope.$watch('field.readonly', function(newValue,oldValue) {
           if(newValue)
                $scope.field.required=false;
        })
        
        $scope.$watch('field.required', function(newValue,oldValue) {
           if(newValue)
               $scope.field.readonly=false;
        })

        $scope.onChangeReadonly = function(field){
            if(field.readonly)
                field.required=false;
        }

        $scope.onChangeRequired = function(field){
            if(field.required)
                field.readonly=false;
        }
        
        $scope.relatedList.criteria = ($scope.relatedList.criteria) ? $scope.relatedList.criteria : {
            group: {
                operator: '&&',
                rules: []
            }
        };
        $scope.relatedList.SObject.fields = [];
        if($scope.relatedList.SObject.SObjectFields !== undefined){
            var allowedTypes = ['string','double','date','currency','boolean','picklist','reference'];
            angular.forEach($scope.relatedList.SObject.SObjectFields, function(field){
                if(field.SObjectField == undefined){
                    field.SObjectField = angular.copy(field);
                }
                if(allowedTypes.indexOf(field.SObjectField.type) !== -1 
                    && field.SObjectField.autoNumber === false 
                    && field.SObjectField.calculated === false 
                    && field.SObjectField.encrypted === false){
                        field.criteriaField = true;
                        $scope.relatedList.SObject.fields.push(field);
                }
            });
        }

        $scope.init = function(){
            console.log('LayoutRelatedListPropertiesModalController loaded!');
            $scope.loadRefSObjects();
        };
        $scope.init();
    }
]).controller('LayoutFieldPropertiesModalController',[
            '$scope','$rootScope','$element','$dialog','$adminLookups','$adminModals','blockUI','data','close','$appCache','userMappingService',
    function($scope , $rootScope , $element , $dialog , $adminLookups , $adminModals , blockUI , data , close,$appCache,userMappingService ){
        $scope.title = (data.title) ? data.title : 'Field Properties' ;
        $scope.layout = (data.layout) ? data.layout : {};
        $scope.section = (data.section) ? data.section : {};
        $scope.section.readonly = $scope.section.readonly ||$scope.layout.type === 'Details';
        $scope.field = (data.field) ? data.field : {};
        $scope.field.readonly = $scope.section.readonly || $scope.field.readonly;
        $scope.field.required = $scope.field.readonly==true?false:$scope.field.required;
        $scope.refSObjects = data.refSObjects;
        $scope.fields = data.fields;
        $scope.forMobile = data.layout.type === 'Mobile' ? true : false;
        if($scope.field.SObjectLookup !== undefined && $scope.field.SObjectLookup !== null && $scope.field.SObjectField.type === 'reference'){
            $scope.field.lookup = {
                labelValue: $scope.field.SObjectLookup.title + ' | ' + $scope.field.SObjectLookup.description,
                value: $scope.field.SObjectLookup.id
            }
        }
        if($scope.field.SObjectField.type === 'boolean'){
            $scope.field.defaultValue = $scope.field.defaultValue === 'true';
        }
        
        $scope.eventFields = ['reference','picklist','boolean'];
        
        $scope.eventFilter = function(event){
            return ((event.datatype.indexOf('void') !== -1)  || event.datatype.indexOf($scope.field.SObjectField.type) !== -1);
        };
        $scope.$watch('field.readonly', function(newValue,oldValue) {
           if(newValue)
                $scope.field.required=false;
        });
        $scope.$watch('field.required', function(newValue,oldValue) {
           if(newValue)
               $scope.field.readonly=false;
        });
        $scope.onChangeReadonly = function(){
            if($scope.field.readonly)
                $scope.field.required=false;
        };
        $scope.onChangeRequired = function(){
            if($scope.field.required)
                $scope.field.readonly=false;
        };
        $scope.onChangeCurrentUserSelect = function(){
            if($scope.field.currentUserSelected)
                $scope.field.excludeCurrentUser=false;
        };
        $scope.onChangeExcludeUser = function(){
            if($scope.field.excludeCurrentUser)
                $scope.field.currentUserSelected=false;
        };
        $scope.openPicklistValuesModal = function(){
            $adminModals.layoutFieldPropertiesPicklistValues({
                field: angular.copy($scope.field)
            }, function(field){
                $scope.field = field;
            });
        };
        $scope.openFieldRequiredCriteriaModal = function(field,index){
            $adminModals.criteriaModal({
                title: 'Field Criteria | ' + field.label,
                fields: $scope.fields,
                criteria: field.requiredCriteria ? field.requiredCriteria : null
            },function(criteria){
                field.requiredCriteria = criteria;
            });
        };
        $scope.openLookupsModal = function(){
            $adminLookups.sObjectLookup({
                criteria: {
                    where: {
                        active: true,
                        default: false,
                        sobjectname: $scope.field.SObjectField.referenceTo[0]
                    }
                }
            }, function(lookup){
                if(lookup){
                    $scope.field.lookup = {
                        labelValue: lookup.title + ' | ' + lookup.description,
                        value: lookup.id
                    }
                }else{
                    $scope.field.lookup = undefined
                }
            });
        };
        
        $scope.close = function(){
            $element.modal('hide');
        };
        $scope.save = function(){
            $scope.field.label = ($scope.field.label) ? $scope.field.label : $scope.field.SObjectField.label;
            $element.modal('hide');
            close($scope.field, 500);
        }

        $scope.userData = function(){
            if($scope.stateCache === undefined){
                $scope.stateCache={};
                userMappingService.loadUserMappingConfiguration({})
                .success(function(response){
                    if(response.success === true){
                        var fields=[];
                        $scope.stateCache.userMasterObjName=response.data.userMapping.SObject.name;
                        $scope.userMasterObjName=$scope.stateCache.userMasterObjName;
                        $appCache.put("layoutFieldPropertiesUserObjName", $scope.stateCache);
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading salesforce org configuration.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.loadUserMappingConfiguration.stop();
                });
                
            }
            else{
                $scope.userMasterObjName=$scope.stateCache.userMasterObjName;
            }

        }

        $scope.init = function(){
            console.log('LayoutFieldPropertiesModalController loaded!');
            $scope.stateCache = $appCache.get("layoutFieldPropertiesUserObjName");
            $scope.userMasterObjName="";
            $scope.userData();
        };
        $scope.init();
    }
]).controller('CriteriaModalController',[
            '$scope','$rootScope','$element','$dialog','blockUI','data','close',
    function($scope , $rootScope , $element , $dialog , blockUI , data , close){
        $scope.title = (data.title) ? data.title : 'Criteria' ;
        $scope.fields = [];
        if(data.fields !== undefined){
            var allowedTypes = ['string','double','date','currency','boolean','picklist','reference'];
            angular.forEach(data.fields, function(field){
                if(field.SObjectField == undefined){
                    field.SObjectField = angular.copy(field);
                }
                if(allowedTypes.indexOf(field.SObjectField.type) !== -1 
                    && field.SObjectField.autoNumber === false 
                    && field.SObjectField.calculated === false 
                    && field.SObjectField.encrypted === false){
                        field.criteriaField = true;
                        $scope.fields.push(field);
                }
            });
        }
        $scope.criteria = (data.criteria) ? data.criteria : {
            group: {
                operator: '&&',
                rules: []
            }
        };
        $scope.oldFields=angular.copy($scope.fields);
        $scope.criteria=angular.copy($scope.criteria);
        $scope.close = function(){
            $scope.fields=$scope.oldFields;
            $scope.criteria=$scope.criteria;
            $element.modal('hide');
        };
        $scope.save = function(){
            $element.modal('hide');
            close($scope.criteria, 500);
        }
        
        $scope.init = function(){
            console.log('CriteriaModalController loaded!');
        };
        $scope.init();
    }
]).controller('MultiObjectCriteriaModalController',[
            '$scope','$rootScope','$element','$dialog','blockUI','data','close',
    function($scope , $rootScope , $element , $dialog , blockUI , data , close){
        $scope.title = (data.title) ? data.title : 'Criteria' ;
        $scope.fields = {};
        if(data.fields !== undefined){
            var allowedTypes = ['string','double','date','currency','boolean','picklist','reference'];
            Object.keys(data.fields).forEach(function(key){
            	angular.forEach(data.fields[key], function(field){
            		if(!$scope.fields[key]){
            			$scope.fields[key] = [];
            		}
                    if(field.SObjectField == undefined){
                        field.SObjectField = angular.copy(field);
                    }
                    if(allowedTypes.indexOf(field.SObjectField.type) !== -1 
                        && field.SObjectField.autoNumber === false 
                        && field.SObjectField.calculated === false 
                        && field.SObjectField.encrypted === false){
                            field.criteriaField = true;
                            $scope.fields[key].push(field);
                    }
                });
            });
        }
        $scope.criteria = (data.criteria) ? data.criteria : {
            group: {
                operator: '&&',
                rules: []
            }
        };
        $scope.oldFields=angular.copy($scope.fields);
        $scope.criteria=angular.copy($scope.criteria);
        $scope.close = function(){
            $scope.fields=$scope.oldFields;
            $scope.criteria=$scope.criteria;
            $element.modal('hide');
        };
        $scope.save = function(){
            $element.modal('hide');
            close($scope.criteria, 500);
        }
        
        $scope.init = function(){
            console.log('MultiObjectCriteriaModalController loaded!');
        };
        $scope.init();
    }
]).controller('LayoutFieldPropertiesPicklistValuesModalController',[
            '$scope','$rootScope','$element','$dialog','blockUI','data','close',
    function($scope , $rootScope , $element , $dialog , blockUI , data , close){
        $scope.title = (data.title) ? data.title : 'Select Picklist values' ;
        $scope.field = (data.field) ? data.field : {};
        $scope.field.picklistValues = ($scope.field.picklistValues) ? $scope.field.picklistValues : [];
        
        $scope.close = function(){
            $element.modal('hide');
        };
        $scope.save = function(){
            $element.modal('hide');
            close($scope.field, 500);
        }
        
        $scope.init = function(){
            console.log('LayoutFieldPropertiesPicklistValuesModalController loaded!');
        };
        $scope.init();
    }
]).controller('AdminClientDashboardContainerPropertyModelController',[
            '$scope','$rootScope','$element','$dialog','blockUI','data','close',
    function($scope , $rootScope , $element , $dialog , blockUI , data , close ){
        $scope.title = data.container.title + ' Properties';
        data.container.label = angular.isUndefined(data.container.label) ? data.container.title : data.container.label;
        $scope.container = data.container;

        $scope.close = function(){
            $element.modal('hide');
        };
        $scope.save = function(){
            $element.modal('hide');
            close($scope.container, 500);
        }
        
        $scope.init = function(){
            console.log('AdminClientDashboardContainerPropertyModelController loaded!');
        };
        $scope.init();
    }
]).controller('AdminClientDashboardContainerComponentPropertyModelController',[
            '$scope','$rootScope','$element','$dialog','blockUI','data','close',
    function($scope , $rootScope , $element , $dialog , blockUI , data , close ){
        $scope.title = data.component.title + ' Properties';
        data.component.label = angular.isUndefined(data.component.label) ? data.component.title : data.component.label;
        // if(angular.isUndefined(data.component.columns) || data.component.columns === 0)
            data.component.columns = 12;
        $scope.component = data.component;

        $scope.close = function(){
            $element.modal('hide');
        };
        $scope.save = function(){
            $element.modal('hide');
            close($scope.component, 500);
        }
        
        $scope.init = function(){
            console.log('AdminClientDashboardContainerComponentPropertyModelController loaded!');
        };
        $scope.init();
    }
]);