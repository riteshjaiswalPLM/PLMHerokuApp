'use strict';

ng.directive('sobjectLayoutField', ['$rootScope','$compile','$parse','$http','$templateCache','CriteriaHelper',function ($rootScope, $compile, $parse, $http, $templateCache,CriteriaHelper) {
    return {
        restrict: 'A', /* optional */
        scope: {
            field   : "=",
            index   : "=",
            model   : "=",
            criteria: "=",
            baseCtrl: "="
        },
        template: '<div class="slds-control" ng-include="getTemplateUrl()"></div>',
        replace: true,
        controller: function($scope,$dialog,ModalService){
            $scope.getTemplateUrl = function(){
                if($scope.field.rendered == undefined){
                   $scope.field.rendered = true; 
                }
                // $scope.field.rendered = true;
                return 'slds/views/directive/layoutfield/'+$scope.field.SObjectField.type+'.html';
            };
            // if($scope.model !== undefined && $scope.field !== undefined){
            if ($scope.field.SObjectField.type === 'boolean' && $scope.field.defaultValue == undefined) {
                $scope.field.defaultValue = false;
            }
            if ($scope.field.SObjectField.type ===  'boolean'  && $scope.field.defaultValue !==  undefined) {
                if (typeof  $scope.field.defaultValue ===  'string')
                    $scope.field.defaultValue = $scope.field.defaultValue ===  'true';
            }
            if ($scope.field.SObjectField && $scope.model && $scope.model[$scope.field.SObjectField.name] === undefined) {
                $scope.model[$scope.field.SObjectField.name] = $scope.field.defaultValue;
                if($scope.field.defaultValue!=undefined && $scope.field.event && $scope.field.event.onChange){
                    $scope.baseCtrl.executeEvent($scope.field.event.onChange, [$scope.field.defaultValue, $scope.field]);
                }
                
            }
            
            $scope.doNotRender = function(){
                $scope.field.rendered = false;
            };

            $scope.criteriaValidation = function(field){
                if(field.criteria){
                    var loading = true;
                    var criteriaWatch = $scope.$watch(
                        function($scope){
                            return $scope.baseCtrl.blockUI.layoutBlock.state().blocking;
                        },
                        function(value){
                            if(!value){
                                criteriaWatch();
                                var criteriaMatched = CriteriaHelper.validate(field.criteria,$scope.model);
                                $scope.field.rendered = true;
                                if(!criteriaMatched){
                                    $scope.doNotRender();
                                }else{
                                     $scope.field.rendered = true;
                                    // ActionValidationService.unregister($scope.section.id);
                                    criteriaWatch();
                                }
                            }
                            loading = false;
                        }
                    );
                }
            };

            $scope.$watch(function(scope){
                return $scope.model ? $scope.model[$scope.field.SObjectField.name] : undefined;
            },function(newValue, oldValue){
                $scope.field.value = newValue;
                if($scope.field.SObjectField.type === 'reference'){
                    if($scope.model && $scope.model[$scope.field.SObjectField.relationshipName] !== undefined && $scope.model[$scope.field.SObjectField.relationshipName] !== null){
                        $scope.field.labelValue = $scope.model[$scope.field.SObjectField.relationshipName][$scope.field.reference];
                    }
                    var userData=JSON.parse($rootScope.user().userdata);
                    if (newValue == undefined || newValue == null) {
                        if( $scope.field.currentUserSelected && $scope.field.currentUserSelected==true ){
                            $scope.model[$scope.field.SObjectField.name] = userData['Id'];
                            $scope.field.labelValue = userData[$scope.field.reference];
                            $scope.field.value=userData['Id'];
                        }
                    }
                    if($scope.field.excludeCurrentUser && $scope.field.excludeCurrentUser==true ){
                        if($scope.model[$scope.field.SObjectField.name] === userData['Id']){
                            $scope.field.labelValue ="";
                            $scope.field.value=null;
                        }
                    }
                }
                if ($scope.field.SObjectField.type === 'multipicklist') {
                    if (oldValue == newValue && $scope.field.value !== undefined && $scope.field.value !== null && $scope.field.value !== "") {
                        $scope.field.value = $scope.field.value.toString().split(';');
                    }
                }
            });

            $scope.$watch(function(scope){
                return $scope.field.value;
            },function(newValue, oldValue){
                if(newValue !== undefined && newValue !== oldValue){
                    if($scope.model)
                        $scope.model[$scope.field.SObjectField.name] = newValue;
                }else if(newValue === undefined){
                    if($scope.model)
                        $scope.model[$scope.field.SObjectField.name] = "";
                         //$scope.model[$scope.field.SObjectField.name] = $scope.field.defaultValue;
                        if($scope.field.SObjectField.type === 'reference' && $scope.field.currentUserSelected && $scope.field.currentUserSelected==true ){
                            var userData=JSON.parse($rootScope.user().userdata);
                            $scope.model[$scope.field.SObjectField.name] = userData['Id'];
                            $scope.field.labelValue = userData[$scope.field.reference];
                        }
                }
            });
            
            if($scope.field.SObjectField.type === 'picklist'){
                $scope.field.picklistValues = $scope.field.picklistValues === undefined ? angular.copy($scope.field.SObjectField.picklistValues) : $scope.field.picklistValues ;
                if($scope.field.SObjectField.controllerName){
                    $scope.isDependentValue = function(index, validFor){
                        var decoded = atob(validFor);
                        var bits = decoded.charCodeAt(index>>3);
                        return ((bits & (0x80 >> (index%8))) != 0);
                    };
                    $scope.$watch(function(scope){
                        return ($scope.model && $scope.model[$scope.field.SObjectField.controllerName]) ? $scope.model[$scope.field.SObjectField.controllerName] : undefined;
                    },function(newValue, oldValue){
                        if(!($scope.field.criteriaField == true)){
                            $scope.field.SObjectField.picklistValues = [];
                        } 
                        if(newValue !== undefined){
                            var ctrlItem = -1;
                            angular.forEach($scope.field.ControllerSObjectField.picklistValues,function(ctrlValue, ctrlValueItem){
                                if(newValue === ctrlValue.value){
                                    ctrlItem = ctrlValueItem;
                                }
                            });
                            if(ctrlItem !== -1){
                                angular.forEach($scope.field.picklistValues, function(item, itemIndex){
                                    if($scope.isDependentValue(ctrlItem,item.validFor)){
                                        $scope.field.SObjectField.picklistValues.push(item);
                                    }
                                });
                            }
                        }
                    });
                }
            }
            
            if($scope.field.SObjectField.type === 'reference'){
                $scope.openLookup = function () {
                    //$dialog.alert('Open lookup for ' + $scope.field.label);
                    
                    ModalService.showModal({
                        templateUrl: 'slds/views/client/lookup/sobjectlookup.html',
                        controller:'ClientSObjectLookupController',
                        inputs:{
                            data: {
                                field: angular.copy($scope.field),
                                dataModal: $scope.model
                            }
                        } 
                    }).then(function(modal){
                         modal.element.modal({backdrop: 'static', keyboard: false});
                        modal.close.then(function(sObject){
                            if($scope.model && $scope.model[$scope.field.SObjectField.relationshipName] === null){
                                $scope.model[$scope.field.SObjectField.relationshipName] = {};
                            }
                            if(sObject){
                                $scope.field.value = sObject.value;
                                $scope.field.labelValue = sObject.labelValue;
                                
                                if($scope.model){
                                    $scope.model[$scope.field.SObjectField.name] = sObject.value;
                                    if($scope.model[$scope.field.SObjectField.relationshipName] === undefined){
                                        $scope.model[$scope.field.SObjectField.relationshipName] = {}
                                    } 
                                    $scope.model[$scope.field.SObjectField.relationshipName][$scope.field.reference] = sObject.labelValue; 
                                }
                            }else{
                                $scope.field.value = null;
                                $scope.field.labelValue = null;
                                $scope.model[$scope.field.SObjectField.name] = null;
                                $scope.model[$scope.field.SObjectField.relationshipName][$scope.field.reference] = null;
                            }
                        });
                    });
                }
            }

            if($scope.field.SObjectField.custom && !$scope.field.readonly && $scope.field.event && $scope.field.event.onChange){
                $scope.oldValue = $scope.model[$scope.field.SObjectField.name];
                $scope.$watch('model.'+[$scope.field.SObjectField.name],
                    function(newVal){
                        if(newVal && $scope.oldValue !== newVal){
                            $scope.oldValue = newVal;
                            $scope.field.fixedValue = $scope.oldValue; 
                            $scope.baseCtrl.executeEvent($scope.field.event.onChange, [newVal, $scope.field]);
                        }
                    }
                );
            }

            $scope.isFieldRequired = function(field){
                var requiredCriteria;
                if(field.requiredCriteria === null || field.requiredCriteria === undefined){
                    requiredCriteria = true;
                }
                else{
                    requiredCriteria = CriteriaHelper.validate(field.requiredCriteria,$scope.model);
                }
                return field.required && requiredCriteria;
            };

            $scope.init = function(){
                if($scope.field){
                    $scope.field.rendered = true;
                    $scope.criteriaValidation($scope.field);
                }
            };

            $scope.init();
        }
    };
}]);

ng.directive('sobjectLayoutSection', ['$compile','$http','blockUI','$log','$timeout','$controller','CriteriaHelper','$rootScope',function ($compile , $http , blockUI , $log , $timeout , $controller , CriteriaHelper, $rootScope) {
    return {
        restrict	:'E',
        scope		:{ 
                        section		 			:'=',
                        sectionIndex			:'=',
                        model					:'=',
                        layoutBlockUiInstance	:'=',
                        type                    :'@',
                        baseCtrl                :'=',
                        slds                    :'@'    
                     },
        templateUrl	:"slds/views/directive/layout/layoutsection.html",
        controller	:function($scope){
            var ctrl = this;
            
            $scope.log = function(msg){
                console.log(msg);
            }
            
            $scope.doRender = function(section){
                $scope.rendered = true;
                section.rendered =true;
            };
            
            $scope.init = function(){
                $scope.rendered = false;
                $scope.criteriaValidation($scope.section);
                $scope.initWatchForChangeEvent();
            };
            
            $scope.initWatchForChangeEvent = function(){
                angular.forEach($scope.section.columns, function(column){
                    angular.forEach(column, function(field) {
                        if(field.event){
                            $scope.$watch('model.'+field.SObjectField.name,
                                function(value){
                                    angular.forEach($scope.baseCtrl.metadata.layoutSections, function(section){
                                        if($rootScope.eventName && field.event && field.event.onChange && field.event.onChange.name == $rootScope.eventName){
                                            $scope.criteriaValidation(section);
                                        }
                                    });
                                }
                            );
                        }
                    });
                });
            };
            
            $scope.criteriaValidation = function(section){
                if(section.criteria){
                    var loading = true;
                    var criteriaWatch = $scope.$watch(
                        function($scope){
                            return $scope.layoutBlockUiInstance.state().blocking;
                        },
                        function(value){
                            if(!value){
                                criteriaWatch();
                                var criteriaMatched = CriteriaHelper.validate(section.criteria,$scope.model);
                                if(criteriaMatched){
                                    $scope.doRender(section);
                                }else{
                                    $scope.rendered = false;
                                    section.rendered =false;
                                    // ActionValidationService.unregister($scope.section.id);
                                    criteriaWatch();
                                }
                            }
                            loading = false;
                        }
                    );
                }else{
                    $scope.doRender(section);
                }
            };
            
            $scope.init();
        },
        link : function(scope, element, attrs) {
            $compile(element.contents())(scope);
        }
    };
}]);

ng.directive('sobjectComponentField', ['$rootScope','$compile','$parse','$http','$templateCache','MultiObjectCriteriaHelper',function ($rootScope, $compile, $parse, $http, $templateCache,MultiObjectCriteriaHelper) {
    return {
        restrict: 'A', /* optional */
        scope: {
            field: "=",
            index: "=",
            model: "=",
            criteria: "=",
            parentCtrl: "=",
            fieldReadonly: "="
        },
        template: '<div ng-include="getTemplateUrl()"></div>',
        replace: true,
        controller: function($scope,$dialog,ModalService){
            $scope.getTemplateUrl = function(){
                if($scope.field.rendered === undefined){
                   $scope.field.rendered = true; 
                }
                return 'slds/views/directive/componentfield/'+$scope.field.SObjectField.type+'.html';
            };
            if($scope.field && $scope.field.SObjectField && $scope.model && $scope.model[$scope.field.SObjectField.name]===undefined)
                $scope.model[$scope.field.SObjectField.name] = $scope.field.defaultValue;
            $scope.readonly = false;
            if($scope.field && $scope.field.readonly){
                $scope.readonly = $scope.field.readonly;
            }
            else{
                if(!angular.isUndefined($scope.fieldReadonly) && $scope.fieldReadonly){
                    $scope.readonly = $scope.fieldReadonly;
                }
            }
            $scope.doNotRender = function(){
                $scope.field.rendered = false;
            };
            $scope.extractSObjectNameFromRule = function(criteria){
                angular.forEach(criteria.group.rules,function(rule){
                    if(rule.group){
                        $scope.SObjectNamesForCriteria.push($scope.extractSObjectNameFromRule(rule));
                    }else{
                        if($scope.SObjectNamesForCriteria.indexOf(rule.SObjectName) === -1){
                            $scope.SObjectNamesForCriteria.push(rule.SObjectName);
                        }
                    }
                });
            };
            $scope.generateSObjectNameProperty = function(criteria){
                if(!criteria){
                    $scope.field.criteria = $scope.generateSObjectNameProperty($scope.field.criteria);
                }
                else{
                    angular.forEach(criteria.group.rules,function(rule){
                        if(rule.group){
                            $scope.field.criteria = $scope.generateSObjectNameProperty(rule);
                        }else{
                            rule.SObjectName = $scope.parentCtrl.dataModel.attributes.type;
                        }
                    });
                    return criteria;
                }
            };
            $scope.criteriaValidation = function(field){
                if(field.criteria){
                    var loading = true;
                    var criteriaWatch = $scope.$watch(
                        function($scope){
                            return $scope.parentCtrl.blockUI.layoutBlock.state().blocking;
                        },
                        function(value){
                            if(!value){
                                criteriaWatch();
                                var dataModel = {};
                                dataModel[$scope.parentCtrl.dataModel.attributes.type] = $scope.parentCtrl.dataModel;
                                if(field.criteria.group.rules.length > 0 && field.criteria.group.rules[0].hasOwnProperty('SObjectName')){
                                    $scope.SObjectNamesForCriteria = [];
                                    $scope.extractSObjectNameFromRule(field.criteria);
                                    $scope.SObjectNamesForCriteria.splice($scope.SObjectNamesForCriteria.indexOf($scope.parentCtrl.dataModel.attributes.type), 1);
                                    if($scope.model.attributes && $scope.SObjectNamesForCriteria.indexOf($scope.model.attributes.type) > -1){
                                        dataModel[$scope.model.attributes.type] = model;
                                    }
                                    var userObj = JSON.parse($rootScope.user().userdata);
                                    dataModel[userObj.attributes.type] = userObj;
                                }
                                else{
                                    $scope.generateSObjectNameProperty();
                                }
                                var criteriaMatched = MultiObjectCriteriaHelper.validate(field.criteria, dataModel);
                                if(!criteriaMatched){
                                    $scope.doNotRender();
                                }else{
                                    criteriaWatch();
                                }
                            }
                            loading = false;
                        }
                    );
                }
            };

            if($scope.model !== undefined && $scope.field !== undefined){
                if($scope.field.SObjectField.type === 'boolean' && $scope.field.defaultValue !== undefined){
                    if(typeof $scope.field.defaultValue === 'string')
                        $scope.field.defaultValue = $scope.field.defaultValue === 'true';
                }
                
                if($scope.model[$scope.field.SObjectField.name] !== undefined){
                    $scope.$watch('model.'+$scope.field.SObjectField.name,function(newValue, oldValue){
                        $scope.model[$scope.field.SObjectField.name] = newValue;
                        if($scope.field.SObjectField.type === 'reference'){
                            if($scope.model[$scope.field.SObjectField.relationshipName] !== undefined && $scope.model[$scope.field.SObjectField.relationshipName] !== null){
                                $scope.field.labelValue = $scope.model[$scope.field.SObjectField.relationshipName][$scope.field.reference];
                            }
                        }
                    });
                }
                $scope.$watch('model.'+$scope.field.SObjectField.name,function(newValue, oldValue){
                    if(newValue !== undefined && newValue !== oldValue){
                        $scope.model[$scope.field.SObjectField.name] = newValue;
                    }else if(newValue === undefined){
                        $scope.model[$scope.field.SObjectField.name] = newValue
                     //   $scope.model[$scope.field.SObjectField.name] = $scope.field.defaultValue;
                    }
                });
                
                if($scope.field.SObjectField.type === 'picklist'){
                    $scope.field.picklistValues = angular.copy($scope.field.SObjectField.picklistValues);
                    if($scope.field.SObjectField.controllerName){
                        $scope.isDependentValue = function(index, validFor){
                            var decoded = atob(validFor);
                            var bits = decoded.charCodeAt(index>>3);
                            return ((bits & (0x80 >> (index%8))) != 0);
                        };
                        $scope.$watch(function(scope){
                            return ($scope.model && $scope.model[$scope.field.SObjectField.controllerName]) ? $scope.model[$scope.field.SObjectField.controllerName] : undefined;
                        },function(newValue, oldValue){
                            
                            if(newValue !== undefined){
                                $scope.field.SObjectField.picklistValues = [];
                                var ctrlItem = -1;
                                angular.forEach($scope.field.ControllerSObjectField.picklistValues,function(ctrlValue, ctrlValueItem){
                                    if(newValue === ctrlValue.value){
                                        ctrlItem = ctrlValueItem;
                                    }
                                });
                                if(ctrlItem !== -1){
                                    angular.forEach($scope.field.picklistValues, function(item, itemIndex){
                                        if($scope.isDependentValue(ctrlItem,item.validFor)){
                                            $scope.field.SObjectField.picklistValues.push(item);
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
                
                if($scope.field.SObjectField.type === 'reference'){
                    $scope.openLookup = function () {
                        //$dialog.alert('Open lookup for ' + $scope.field.label);
                        
                        ModalService.showModal({
                            templateUrl: 'slds/views/client/lookup/sobjectlookup.html',
                            controller:'ClientSObjectLookupController',
                            inputs:{
                                data: {
                                    field: angular.copy($scope.field),
                                    dataModal: $scope.parentCtrl.dataModel
                                }
                            } 
                        }).then(function(modal){
                            modal.element.modal();
                            modal.close.then(function(sObject){
                                if($scope.model[$scope.field.SObjectField.relationshipName] === null){
                                    $scope.model[$scope.field.SObjectField.relationshipName] = {};
                                }
                                if(sObject){
                                    // $scope.field.value = sObject.value;
                                    // $scope.field.labelValue = sObject.labelValue;
                                    
                                    $scope.model[$scope.field.SObjectField.name] = sObject.value;
                                    $scope.model[$scope.field.SObjectField.relationshipName][$scope.field.reference] = sObject.labelValue; 
                                }else{
                                    // $scope.field.value = null;
                                    // $scope.field.labelValue = null;
                                    $scope.model[$scope.field.SObjectField.name] = null;
                                    $scope.model[$scope.field.SObjectField.relationshipName][$scope.field.reference] = null;
                                }
                            });
                        });
                    }
                }
            }

            $scope.init = function(){
                if($scope.field){
                    $scope.field.rendered = true;
                    $scope.criteriaValidation($scope.field);
                }
                $scope.SObjectNamesForCriteria = [];
            };

            $scope.init();
        }
    };
}]);

ng.directive('referenceFieldSelector',['ModalService','$dialog', function(ModalService,$dialog){
    return {
        restrict: 'A',
        scope: {
            field: "=",
            refSobjects: "="
        },
        template: '<a   href="javascript:void(0);" class="slds-card__header-link slds-truncate" ng-if="field.SObjectField.type === \'reference\'" ng-click="openReferenceFieldLookup();" title="{{field.reference}}"><svg class="slds-icon slds-icon-text-default slds-p-around--x-small" aria-hidden="true"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/slds221/assets/icons/utility-sprite/svg/symbols.svg#link"></use></svg>{{field.reference}}</a>',
        controller: function($scope){
            $scope.field.reference = ($scope.field.reference) ? $scope.field.reference : (($scope.field.referenceRemoved !== undefined && $scope.field.referenceRemoved === true)? undefined : 'Name');
            $scope.openReferenceFieldLookup = function(){
                if($scope.field.SObjectField.custom === false){
                    $dialog.alert('Reference field can not be changed for Salesforce standard fields!','Warning','pficon pficon-warning-triangle-o');
                    return;
                }
                if($scope.refSobjects !== undefined && $scope.refSobjects[$scope.field.SObjectField.referenceTo[0]] !== undefined){
                    ModalService.showModal({
                        templateUrl: 'slds/views/directive/control/referencefield.html',
                        controller:'ReferenceFieldLookupController',
                        inputs:{
                            data: {
                                title: 'Select field',
                                field: $scope.field,
                                refSObject: $scope.refSobjects[$scope.field.SObjectField.referenceTo[0]]
                            }  
                        }
                    }).then(function(modal){
                        modal.element.modal({backdrop: 'static', keyboard: false});
                        modal.close.then(function(referenceField){
                            $scope.field.reference = referenceField;
                            $scope.field.referenceRemoved = false;
                        });
                    });
                }else{
                    $dialog.alert('No sobject added for \"'+$scope.field.SObjectField.label+'\" field! \nPlease add \"'+ $scope.field.SObjectField.referenceTo[0] +'\" in SObjects.','Warning','pficon pficon-warning-triangle-o');
                    return;
                }
            }
        }
    }
}]).controller('ReferenceFieldLookupController',[
            '$scope','$rootScope','$timeout','$element','blockUI','data','close',
    function($scope , $rootScope , $timeout , $element , blockUI , data , close){
        $scope.title = (data.title) ? data.title : 'Select field' ;
        $scope.field = data.field;
        $scope.refSObject = data.refSObject;
        
        $scope.close = function(){
            $element.modal('hide');
        };
        $scope.selectAndClose = function(referenceField){
            $element.modal('hide');
            close(referenceField, 500);
        }
        
        $scope.init = function(){
            // $timeout($scope.loadIcons,500);
        };
        $scope.init();
    }
]).controller('FieldLookupController',[
            '$scope','$rootScope','$timeout','$element','blockUI','data','close',
    function($scope , $rootScope , $timeout , $element , blockUI , data , close){
        $scope.title = (data.title) ? data.title : 'Select field' ;
        $scope.field = data.field;
        $scope.refSObject = data.refSObject;
        $scope.filter = data.filter ? data.filter : {};
        $scope.close = function(){
            $element.modal('hide');
        };
        $scope.selectAndClose = function(referenceField, referenceFieldObject){
            $element.modal('hide');
            close(referenceFieldObject, 500);
        }
        
        $scope.init = function(){
            // $timeout($scope.loadIcons,500);
        };
        $scope.init();
    }
]);

ng.directive('criteriaBuilder',['$compile',function($compile){
    return {
        restrict: 'E',
        scope: {
            group: "=",
            fields: "="
        },
        templateUrl: 'slds/views/directive/control/criteriabuilder.html',
        controller: 'CriteriaBuilderController',
        compile: function(element, attrs){
            var content, directive;
            content = element.contents().remove();
            return function(scope, element, attrs){
                scope.ruleFields = angular.copy(scope.fields);
                scope.operators = [{label: 'AND', value: '&&'},{label: 'OR', value: '||'}]
                scope.conditions = ["==","!=",">",">=","<","<="];
                scope.conditions = [
                    { value: '==',   types: ['string','double','date','currency','boolean','picklist','reference']},
                    { value: '!=',  types: ['string','double','date','currency','boolean','picklist','reference']},
                    { value: '>',   types: ['double','date','currency']},
                    { value: '<',   types: ['double','date','currency']},
                    { value: '>=',  types: ['double','date','currency']},
                    { value: '<=',  types: ['double','date','currency']}
                ]
                
                scope.addRule = function(){
                    scope.group.rules.push({
                        condition: null,
                        field: null,
                        data: {}
                    });
                };
                scope.removeRule = function(index){
                    scope.group.rules.splice(index, 1);
                };
                scope.addGroup = function(){
                    scope.group.rules.push({
                        group: {
                            operator: '&&',
                            rules: []
                        }
                    });
                };
                scope.removeGroup = function(){
                    "group" in scope.$parent && scope.$parent.group.rules.splice(scope.$parent.$index,1);
                };
                
                directive || (directive = $compile(content));
                
                element.append(directive(scope, function($compile){
                    return $compile;
                }));
            };
        }
    }
}]).controller('CriteriaBuilderController',[
            '$scope','$rootScope','userMappingService','$appCache',
    function($scope , $rootScope,userMappingService,$appCache){
        $scope.updateRef = function(rule){
            rule.field.reference=rule.data.fieldname;
        }
        $scope.userData = function(){
            if($scope.stateCache === undefined){
                $scope.stateCache={};
                userMappingService.loadUserMappingConfiguration({})
                .success(function(response){
                    if(response.success === true){
                        var fields=[];
                        $scope.stateCache.userMasterObjName=response.data.userMapping.SObject.name;
                        angular.forEach(response.data.userMapping.SObject.SObjectFields,function(field){
                           var data={ 
                               label :field.label,
                               fieldname:field.name
                            }
                           fields.push(data);
                        });
                        $scope.stateCache.userDataField =fields ;
                        $scope.userMasterObjName=$scope.stateCache.userMasterObjName;
                        $scope.userDataField = $scope.stateCache.userDataField;
                        $appCache.put("criteriaBuilderUserMappingFields", $scope.stateCache);
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
                $scope.userDataField = $scope.stateCache.userDataField;
            }

        }
        $scope.init = function(){
            console.log('CriteriaBuilderController loaded!');
            $scope.stateCache = $appCache.get("criteriaBuilderUserMappingFields");
            $scope.userDataField=[];
            $scope.userMasterObjName="";
            $scope.userData();
        };
        $scope.init();
    }
]);

ng.directive('multiObjectCriteriaBuilder',['$compile',function($compile){
    return {
        restrict: 'E',
        scope: {
            group: "=",
            fields: "="
        },
        templateUrl: 'slds/views/directive/control/multiObjectcriteriabuilder.html',
        controller: 'MultiObjectCriteriaBuilderController',
        compile: function(element, attrs){
            var content, directive;
            content = element.contents().remove();
            return function(scope, element, attrs){
                scope.ruleFields = angular.copy(scope.fields);
                scope.operators = [{label: 'AND', value: '&&'},{label: 'OR', value: '||'}]
                scope.conditions = ["==","!=",">",">=","<","<="];
                scope.conditions = [
                    { value: '==',   types: ['string','double','date','currency','boolean','picklist','reference']},
                    { value: '!=',  types: ['string','double','date','currency','boolean','picklist','reference']},
                    { value: '>',   types: ['double','date','currency']},
                    { value: '<',   types: ['double','date','currency']},
                    { value: '>=',  types: ['double','date','currency']},
                    { value: '<=',  types: ['double','date','currency']}
                ]
                
                scope.addRule = function(){
                    scope.group.rules.push({
                        condition: null,
                        field: null,
                        data: {}
                    });
                };
                scope.removeRule = function(index){
                    scope.group.rules.splice(index, 1);
                };
                scope.addGroup = function(){
                    scope.group.rules.push({
                        group: {
                            operator: '&&',
                            rules: []
                        }
                    });
                };
                scope.removeGroup = function(){
                    "group" in scope.$parent && scope.$parent.group.rules.splice(scope.$parent.$index,1);
                };
                
                directive || (directive = $compile(content));
                
                element.append(directive(scope, function($compile){
                    return $compile;
                }));
            };
        }
    }
}]).controller('MultiObjectCriteriaBuilderController',[
            '$scope','$rootScope','userMappingService','$appCache',
    function($scope , $rootScope,userMappingService,$appCache){
        $scope.updateRef = function(rule){
            rule.field.reference=rule.data.fieldname;
        }
        $scope.userData = function(){
            if($scope.stateCache === undefined){
                $scope.stateCache={};
                userMappingService.loadUserMappingConfiguration({})
                .success(function(response){
                    if(response.success === true){
                        var fields=[];
                        $scope.stateCache.userMasterObjName=response.data.userMapping.SObject.name;
                        angular.forEach(response.data.userMapping.SObject.SObjectFields,function(field){
                           var data={ 
                               label :field.label,
                               fieldname:field.name
                            }
                           fields.push(data);
                        });
                        $scope.stateCache.userDataField =fields ;
                        $scope.userMasterObjName=$scope.stateCache.userMasterObjName;
                        $scope.userDataField = $scope.stateCache.userDataField;
                        $appCache.put("criteriaBuilderUserMappingFields", $scope.stateCache);
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
                $scope.userDataField = $scope.stateCache.userDataField;
            }

        }
        $scope.init = function(){
            console.log('MultiObjectCriteriaBuilderController loaded!');
            $scope.stateCache = $appCache.get("criteriaBuilderUserMappingFields");
            $scope.userDataField=[];
            $scope.userMasterObjName="";
            $scope.userData();
        };
        $scope.init();
    }
]);

ng.directive('layoutRelatedList',['ModalService','$dialog', function(ModalService,$dialog){
    return {
        restrict: 'A',
        scope: {
            model: "=",
            parentSObject: "=",
            index: "=",
            datamodel: "=",
            parentStateParamData: "="
        },
        templateUrl: 'slds/views/directive/control/layoutrelatedlist.html',
        controller: 'LayoutRelatedListController'
    }
}]).controller('LayoutRelatedListController', [
            '$scope','$rootScope','$filter','$dialog','blockUI','clientSObjectService','CriteriaHelper','$state',
    function($scope , $rootScope , $filter , $dialog , blockUI , clientSObjectService,CriteriaHelper,$state){
        var orderBy = $filter('orderBy');
        $scope.search = function(page,pageSize){
            if($scope.rendered)
            {
                var whereFields ={};
                var whereClauseString=$scope.model.whereClause;
                whereFields[$scope.model.SObjectField.name] = $scope.parentSObject.Id;
                if(whereClauseString!=undefined && whereClauseString!=null){
                    while(whereClauseString.indexOf("{")!=-1){
                        if($scope.datamodel[whereClauseString.substring(whereClauseString.indexOf("{")+1,whereClauseString.indexOf("}"))]!=null){
                            whereClauseString=whereClauseString.substring(0,whereClauseString.indexOf("{"))
                                +$scope.datamodel[whereClauseString.substring(whereClauseString.indexOf("{")+1,whereClauseString.indexOf("}"))]
                                +whereClauseString.substring(whereClauseString.indexOf("}")+1)
                        }
                        else{
                            console.log(whereClauseString.substring(whereClauseString.indexOf("{")+1,whereClauseString.indexOf("}"))+"Field not configured in layout")
                            break;
                        }
                        
                    }
                }
                var queryObject = {
                    sObject: $scope.model.SObject,
                    selectFields: $scope.model.SObjectLayoutFields,
                    whereFields: whereFields,
                    whereClauseString:whereClauseString,
                    orderBy:$scope.model.orderBy,
                    limit: pageSize,
                    page: page
                };  
                
                $scope.blockUI.start();
                clientSObjectService.search(queryObject)
                    .success(function(response){
                        if(response.success){
                            $scope.searchResult = response.data.searchResult;
                            $scope.currentPage = response.data.currentPage;
                            $scope.hasMore = response.data.hasMore;
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.stop();
                    })
                    .error(function(response){
                        $dialog.alert('Server error occured while querying data.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.stop();
                    });
            }
        };
        $scope.doAction = function(record){
            var _editAction=undefined;
            var editCriteria=undefined;
            angular.forEach($scope.model.SObject.SObjectLayouts,function(layout){
                if(layout.type=='Edit' & layout.active==true){
                    _editAction={
                        type: 'record',
                        label: 'edit',
                        state: 'client.'+$scope.model.SObject.keyPrefix+'.'+'edit',
                        
                    }
                    
                }
                else if(layout.type=='List'){
                    angular.forEach(layout.btnCriteria,function(btnCriteria){
                        if(btnCriteria.keyName=='Edit'){
                            editCriteria=btnCriteria.criteria;
                        }
                    });
                    
                }
            });
            if(_editAction!=undefined){
                _editAction['criteria']=editCriteria;
            }
            $state.go('client.'+$scope.model.SObject.keyPrefix+'.'+'details', {
                data: {
                    record: record,
                    editAction:_editAction,
                    isFromRelatedList:true,
                    parentStateParamData:$scope.parentStateParamData,
                    parentState:$state.current.name,
                }   
            });
        };
        $scope.showlink = function(){
            if($scope.model.SObject && $scope.model.SObject.keyPrefix!=null && $scope.model.SObject.keyPrefix!="")
            return $state.href('client.'+$scope.model.SObject.keyPrefix+'.'+'details');
        }
        $scope.applyOrderBy = function(field){
            if($scope.searchResult && $scope.searchResult.length > 0){
                $scope.predicate = field.SObjectField.name;
                $scope.reverse = ($scope.predicate === field.SObjectField.name) ? !$scope.reverse : false;
                $scope.searchResult = orderBy($scope.searchResult, field.SObjectField.name, $scope.reverse);
            }
        };
        $scope.doRender = function(section){
            $scope.rendered = true;
        };
        
        $scope.criteriaValidation = function(section){
            if(section.criteria){
                
                // var loading = true;
                // var criteriaWatch = $scope.$watch(
                //     function($scope){
                //         return $scope.blockUI.state().blocking;
                //     },
                //     function(value){
                //         if(!value){
                //             criteriaWatch();
                //             var criteriaMatched = CriteriaHelper.validate(section.criteria,$scope.datamodel);
                //             if(criteriaMatched){
                //                 $scope.doRender(section);
                //             }else{
                //                  $scope.rendered = false;
                //                 // ActionValidationService.unregister($scope.section.id);
                //                 criteriaWatch();
                //             }
                //         }
                //         loading = false;
                //     }
                // );
                var criteriaMatched = CriteriaHelper.validate(section.criteria,$scope.datamodel);
                if(criteriaMatched){
                    $scope.doRender(section);
                }else{
                        $scope.rendered = false;
                }
            }else{
                $scope.doRender(section);
            }
        };
        $scope.init = function(){
            $scope.blockUI = blockUI.instances.get('relatedList_'+ $scope.model.id+'_'+$scope.index);
            $scope.pageSize = 25;
            $scope.currentPage = 0;
            console.log('LayoutRelatedListController loaded!');
            $scope.rendered = false;
            $scope.criteriaValidation($scope.model);
            $scope.groupByData=$scope.model.groupBy!=undefined && $scope.model.groupBy!=''?"["+$scope.model.groupBy+"]":undefined;
            if($scope.groupByData!=undefined){
                $scope.pageSize=1000;
                var groupByField=","+ $scope.model.groupBy+",";
                groupByField=groupByField.replace(/-+/g, '');
                var groupByFields={}
                $scope.model.SObjectLayoutFields.forEach(function(field){
                    if(groupByField.indexOf(","+field.SObjectField.name+",")!=-1){
                        groupByFields[field.SObjectField.name]=field.label;
                    }
                });
                $scope.groupFieldsLabel="";
                groupByField.split(",").forEach(function(rec){
                    if(rec!=undefined &&  rec!=""){
                        if($scope.groupFieldsLabel==""){
                            $scope.groupFieldsLabel=groupByFields[rec];
                        }
                        else{
                            $scope.groupFieldsLabel+=","+groupByFields[rec];
                        }
                    }
                });
            }
            // $scope.orderByData=$scope.model.orderBy!=undefined && $scope.model.orderBy!=undefined?$scope.model.orderBy.split(","):'';
            $scope.search(1,$scope.pageSize);
            $scope.sObjectMetaData=$scope.$parent.$parent.$parent.$parent.sObjectMetaData;
            // $dialog.alert(JSON.stringify($scope.parentSObject));
        };
        $scope.init();
    }
]);

ng.directive('pfDatetimepicker', function () {

  return {
    replace: true,
    restrict: 'A',
    require: '^form',
    templateUrl: 'slds/views/directive/control/datetimepicker.html',
    scope: {
      options: '=',
      datetime: '='
    },
    link: function ($scope, element) {

    //   //Make sure the date picker is set with the correct options
    //   element.datepicker($scope.options);
    
    element.datetimepicker($scope.options);

    //   //Set the initial value of the date picker
    //   element.datepicker('update', $scope.date);
    
    element.datetimepicker('update', $scope.datetime);

    //   //Change happened on the date picker side. Update the underlying date model
    //   element.datepicker($scope.date).on('changeDate', function (elem) {
    //     $scope.$apply(function () {
    //       $scope.date = elem.date;
    //     });
    //   });

    //   //Update the date picker if there is a change on the date model
    //   $scope.$watch('date', function (newValue, oldValue) {
    //     if (oldValue !== newValue) {
    //       element.datepicker('update', newValue);
    //     }
    //   });
    }
  };
});

ng.directive('pfTooltip', function ($compile,$timeout) {
  return {
    restrict: 'A',
    scope: {
        options: '='
    },
    link: function ($scope, element, attrs) {
        $timeout(function(){
            element.tooltip($scope.options);
        },100);
    }
  };
});

ng.directive('fileField', function() {
  return {
    require:'ngModel',
    restrict: 'E',
    scope: {
        callback: '=',
        allowedExt: '='
    },
    link: function (scope, element, attrs, ngModel) {
        var fileReader = new FileReader();
        if(!attrs.class && !attrs.ngClass){
            element.addClass('btn');
        }
        
        var fileField = element.find('input');

        fileReader.onload = function () {
            ngModel.$setViewValue(fileReader.result);
            scope.callback();
            if ('fileLoaded' in attrs) {
                scope.$eval(attr['fileLoaded']);
            }
        };

        fileField.bind('change', function(event){
            fileReader.readAsText(event.target.files[0]);
        });
        fileField.bind('click',function(e){
            e.stopPropagation();
        });
        element.bind('click',function(e){
            e.preventDefault();
            fileField[0].click()
        });        
    },
    template:'<button type="button"><ng-transclude></ng-transclude><input type="file" name="uploads[]" accept="{{allowedExt}}" style="display:none"></button>',
    replace:true,
    transclude:true
  };
});

ng.directive('component', function($controller){
    return {
        restrict: 'A', /* optional */
        scope: {
            section: "=",
            ctrl: "=",
            type: "@"
        },
        template: '<div class="slds-size--1-of-1" ng-include="getTemplateURL()"></div>',
        controller: function($scope){
            if($scope.section.Component.catagory){
                if($scope.section.Component.catagory == 'UploadAttachment'){
                    $scope.files = [];
                    $scope.$watch(function(){
                        return $scope.files;
                    },function(newValue, oldValue){
                        if(newValue){
                            $scope.ctrl.files = $scope.files;
                        }
                    });
                }
            }
            if($scope.section.Component.catagory){
                angular.extend($scope.ctrl, $controller($scope.section.Component.catagory+'Controller',{ $scope: $scope}));
            }
            else{
                angular.extend($scope.ctrl, $controller($scope.section.Component.name.replace(/\s/g,"")+'Controller',{ $scope: $scope}));
            }
            $scope.getTemplateURL = function() {
                if($scope.section.Component.catagory){
                    return 'slds/views/client/layout/component/'+$scope.section.Component.catagory+'.html';
                }
                else{
                    if($scope.section.Component.name === 'Cost Allocation Component'){
                        return 'slds/views/client/layout/component/'+$scope.section.Component.name.replace(/\s/g,"")+'.html';
                    }
                    if($scope.section.Component.name === 'Change Request Component'){
                        return 'slds/views/client/layout/component/'+$scope.section.Component.name.replace(/\s/g,"")+'.html';
                    }
                    if($scope.section.Component.name === 'Other Charge Component'){
                        return 'slds/views/client/layout/component/'+$scope.section.Component.name.replace(/\s/g,"")+'.html';
                    }
                    return;
                }
            };
        }
    };
});

ng.filter('currencyFilter', 
            ['$filter',
    function($filter){
        return function(input){
            var numberFilter = $filter('number');
            var inputVal = (input) 
                             //? numberFilter(input,2).toString().trim().replace(',','').trim() 
                            ? numberFilter(input,2).toString().trim().split(",").join("").trim()
                            : null;
            return parseFloat(inputVal);
        };
}]);

ng.directive('archivalSobjectLayoutSection', ['$compile', '$http', 'blockUI', '$log', '$timeout', '$controller', 'CriteriaHelper', '$rootScope', function ($compile, $http, blockUI, $log, $timeout, $controller, CriteriaHelper, $rootScope) {
    return {
        restrict: 'E',
        scope: {
            section: '=',
            sectionIndex: '=',
            model: '=',
            layoutBlockUiInstance: '=',
            type: '@',
            baseCtrl: '=',
            slds: '@'
        },
        templateUrl: "slds/views/directive/layout/archivallayoutsection.html",
        controller: function ($scope) {
            var ctrl = this;

            $scope.log = function (msg) {
                console.log(msg);
            }

            $scope.doRender = function (section) {
                $scope.rendered = true;
                section.rendered = true;
            };

            $scope.init = function () {
                $scope.rendered = false;
                $scope.criteriaValidation($scope.section);
                $scope.initWatchForChangeEvent();
            };

            $scope.initWatchForChangeEvent = function () {
                angular.forEach($scope.section.columns, function (column) {
                    angular.forEach(column, function (field) {
                        if (field.event) {
                            $scope.$watch('model.' + field.SObjectField.name,
                                function (value) {
                                    angular.forEach($scope.baseCtrl.metadata.layoutSections, function (section) {
                                        if ($rootScope.eventName && field.event && field.event.onChange && field.event.onChange.name == $rootScope.eventName) {
                                            $scope.criteriaValidation(section);
                                        }
                                    });
                                }
                            );
                        }
                    });
                });
            };

            $scope.criteriaValidation = function (section) {
                if (section.criteria) {
                    var loading = true;
                    var criteriaWatch = $scope.$watch(
                        function ($scope) {
                            return $scope.layoutBlockUiInstance.state().blocking;
                        },
                        function (value) {
                            if (!value) {
                                criteriaWatch();
                                var criteriaMatched = CriteriaHelper.validate(section.criteria, $scope.model);
                                if (criteriaMatched) {
                                    $scope.doRender(section);
                                } else {
                                    $scope.rendered = false;
                                    section.rendered = false;
                                    // ActionValidationService.unregister($scope.section.id);
                                    criteriaWatch();
                                }
                            }
                            loading = false;
                        }
                    );
                } else {
                    $scope.doRender(section);
                }
            };

            $scope.init();
        },
        link: function (scope, element, attrs) {
            $compile(element.contents())(scope);
        }
    };
}]);

ng.directive('archivalComponent', function ($controller) {
    return {
        restrict: 'A', /* optional */
        scope: {
            section: "=",
            ctrl: "=",
            type: "@"
        },
        template: '<div class="slds-size--1-of-1" ng-include="getTemplateURL()"></div>',
        controller: function ($scope) {
            if ($scope.section.Component.catagory) {
                if ($scope.section.Component.catagory == 'UploadAttachment') {
                    $scope.files = [];
                    $scope.$watch(function () {
                        return $scope.files;
                    }, function (newValue, oldValue) {
                        if (newValue) {
                            $scope.ctrl.files = $scope.files;
                        }
                    });
                }
            }

            if ($scope.section.Component.catagory) {
                angular.extend($scope.ctrl, $controller($scope.section.Component.catagory + 'ArchivalController', { $scope: $scope }));
            }
            else {
                angular.extend($scope.ctrl, $controller($scope.section.Component.name.replace(/\s/g, "") + 'ArchivalController', { $scope: $scope }));
            }
            $scope.getTemplateURL = function () {
                if ($scope.section.Component.catagory) {
                    return 'slds/views/client/layout/archivalcomponent/' + $scope.section.Component.catagory + '.html';
                }
                // else{
                //     if($scope.section.Component.name === 'Cost Allocation Component'){
                //         return 'slds/views/client/layout/archivalcomponent/'+$scope.section.archivalcomponent.name.replace(/\s/g,"")+'.html';
                //     }
                //     if($scope.section.Component.name === 'Change Request Component'){
                //         return 'slds/views/client/layout/archivalcomponent/'+$scope.section.archivalcomponent.name.replace(/\s/g,"")+'.html';
                //     }
                //     if($scope.section.Component.name === 'Other Charge Component'){
                //         return 'slds/views/client/layout/archivalcomponent/'+$scope.section.archivalcomponent.name.replace(/\s/g,"")+'.html';
                //     }
                //     return;
                // }
            };
        }
    };
});
ng.directive('archivalRelatedList', ['ModalService', '$dialog', function (ModalService, $dialog) {
    return {
        restrict: 'A',
        scope: {
            model: "=",
            parentSObject: "=",
            index: "=",
            datamodel: "="
        },
        templateUrl: 'slds/views/directive/control/archivalrelatedlist.html',
        controller: 'ArchivalRelatedListController'
    }
}]).controller('ArchivalRelatedListController', [
    '$scope', '$rootScope', '$filter', '$dialog', 'blockUI', 'clientArchivalService', 'CriteriaHelper',
    function ($scope, $rootScope, $filter, $dialog, blockUI, clientArchivalService, CriteriaHelper) {
        var orderBy = $filter('orderBy');

        $scope.search = function (page, pageSize) {
            if ($scope.rendered) {
                var whereFields = {};
                var whereClauseString = $scope.model.whereClause;
                whereFields[$scope.model.SObjectField.name] = $scope.parentSObject.id;
                if (whereClauseString != undefined && whereClauseString != null) {
                    while (whereClauseString.indexOf("{") != -1) {
                        if ($scope.datamodel[whereClauseString.substring(whereClauseString.indexOf("{") + 1, whereClauseString.indexOf("}"))] != null) {
                            whereClauseString = whereClauseString.substring(0, whereClauseString.indexOf("{"))
                                + $scope.datamodel[whereClauseString.substring(whereClauseString.indexOf("{") + 1, whereClauseString.indexOf("}"))]
                                + whereClauseString.substring(whereClauseString.indexOf("}") + 1)
                        }
                        else {
                            console.log(whereClauseString.substring(whereClauseString.indexOf("{") + 1, whereClauseString.indexOf("}")) + "Field not configured in layout")
                            break;
                        }

                    }
                }
                var queryObject = {
                    sObject: $scope.model.SObject,
                    SObjectField: $scope.model.SObjectField,
                    whereFields: whereFields,
                    whereClauseString: whereClauseString,
                    orderBy: $scope.model.orderBy,
                    limit: pageSize,
                    page: page
                };
                $scope.blockUI.start();
                queryObject.dataModel = $scope.datamodel;
                clientArchivalService.searchDetails(queryObject)
                    .success(function (response) {
                        if (response.success) {
                            $scope.searchResult = response.data.dataModel;
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.stop();
                    })
                    .error(function (response) {
                        $dialog.alert('Server error occured while querying data.', 'Error', 'pficon pficon-error-circle-o');
                        $scope.blockUI.stop();
                    });
            }
        };


        $scope.applyOrderBy = function (field) {
            if ($scope.searchResult && $scope.searchResult.length > 0) {
                $scope.predicate = field.SObjectField.name;
                $scope.reverse = ($scope.predicate === field.SObjectField.name) ? !$scope.reverse : false;
                $scope.searchResult = orderBy($scope.searchResult, field.SObjectField.name, $scope.reverse);
            }
        };
        $scope.doRender = function (section) {
            $scope.rendered = true;
        };

        $scope.criteriaValidation = function (section) {
            if (section.criteria) {

                // var loading = true;
                // var criteriaWatch = $scope.$watch(
                //     function($scope){
                //         return $scope.blockUI.state().blocking;
                //     },
                //     function(value){
                //         if(!value){
                //             criteriaWatch();
                //             var criteriaMatched = CriteriaHelper.validate(section.criteria,$scope.datamodel);
                //             if(criteriaMatched){
                //                 $scope.doRender(section);
                //             }else{
                //                  $scope.rendered = false;
                //                 // ActionValidationService.unregister($scope.section.id);
                //                 criteriaWatch();
                //             }
                //         }
                //         loading = false;
                //     }
                // );
                var criteriaMatched = CriteriaHelper.validate(section.criteria, $scope.datamodel);
                if (criteriaMatched) {
                    $scope.doRender(section);
                } else {
                    $scope.rendered = false;
                }
            } else {
                $scope.doRender(section);
            }
        };
        $scope.previousNext = function (count) {
            $scope.currentPage = $scope.currentPage + count;
        }
        $scope.init = function () {
            $scope.blockUI = blockUI.instances.get('relatedList_' + $scope.model.id + '_' + $scope.index);
            $scope.pageSize = 25;
            $scope.currentPage = 0;
            console.log('ArchivalRelatedListController loaded!');
            $scope.rendered = false;
            $scope.criteriaValidation($scope.model);
            $scope.groupByData = $scope.model.groupBy != undefined && $scope.model.groupBy != '' ? "[" + $scope.model.groupBy + "]" : undefined;
            if ($scope.groupByData != undefined) {
                $scope.pageSize = 1000;
                var groupByField = "," + $scope.model.groupBy + ",";
                groupByField = groupByField.replace(/-+/g, '');
                var groupByFields = {}
                $scope.model.SObjectLayoutFields.forEach(function (field) {
                    if (groupByField.indexOf("," + field.SObjectField.name + ",") != -1) {
                        groupByFields[field.SObjectField.name] = field.label;
                    }
                });
                $scope.groupFieldsLabel = "";
                groupByField.split(",").forEach(function (rec) {
                    if (rec != undefined && rec != "") {
                        if ($scope.groupFieldsLabel == "") {
                            $scope.groupFieldsLabel = groupByFields[rec];
                        }
                        else {
                            $scope.groupFieldsLabel += "," + groupByFields[rec];
                        }
                    }
                });
            }
            $scope.search(1, $scope.pageSize);
            $scope.sObjectMetaData = $scope.$parent.$parent.$parent.$parent.sObjectMetaData;
        };
        $scope.init();
    }
]);