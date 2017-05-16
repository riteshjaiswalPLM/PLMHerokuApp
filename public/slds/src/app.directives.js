'use strict';

app.directive('includeReplace', ['$rootScope',function ($rootScope) {
    return {
        require: 'ngInclude',
        restrict: 'A', /* optional */
        link: function (scope, el, attrs) {
            el.replaceWith(el.children());
        }
    };
}]);

app.directive('pfTouchSpin', ['$rootScope',function ($rootScope) {
    return {
        require: 'ngModel',
        restrict: 'A', /* optional */
        link: function (scope, el, attrs) {
            el.TouchSpin();
        }
    };
}]);

app.directive('sldsNotification',['$rootScope', function($rootScope){
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="slds-notify_container"  style="width: 100%;font-size:12px"><div ng-repeat="notification in notifications.data"  ><div class="slds-notify slds-notify--toast slds-theme--{{notification.type ==\'danger\'? \'error\':notification.type }}" role="alert" style="width: 100%;padding: 0.5rem 1.5rem;margin:0px;margin-bottom: .5rem"><span class="slds-assistive-text">Info</span><button class="slds-button slds-notify__close slds-button--icon-inverse" title="Close" ng-click="$parent.notifications.remove($index)"><svg class="slds-button__icon slds-button__icon--large" aria-hidden="true"><use xlink:href="slds221/assets/icons/utility-sprite/svg/symbols.svg#close"></use></svg><span class="slds-assistive-text">Close</span></button><div class="slds-notify__content slds-grid"><svg class="slds-icon slds-icon--small slds-m-right--small slds-col slds-no-flex" aria-hidden="true"><use xlink:href="{{notification.type ==\'danger\'? \'slds221/assets/icons/utility-sprite/svg/symbols.svg#error\':\'slds221/assets/icons/utility-sprite/svg/symbols.svg#\'+notification.type}}"></use></svg><div class="slds-col slds-align-middle"><h2 class="slds-text-heading--small "><strong>{{notification.header}}</strong> {{notification.message}}</h2></div></div></div></div></div>',
        link: function(scope, el, attrs, ngModel){
        }
    };
}]);
app.directive('sldsSwitch',['$rootScope', function($rootScope){
    return {
        require: 'ngModel',
        restrict: 'E',
        scope: {
            id: "@",
            onText: "@",
            offText: "@",
            switchChange: "&",
            showTexts: "=",
            switchReadonly: "="
        },
        replace: true,
        template: '<label class="slds-checkbox--toggle slds-grid"><input id="{{id}}" type="checkbox" name="checkbox" aria-describedby="{{descId}}" ng-model="value" ng-disabled="switchReadonly" /><span id="{{descId}}" class="slds-checkbox--faux_container" aria-live="assertive"><span class="slds-checkbox--faux"></span><span class="slds-checkbox--on" ng-if="showTexts">{{onText}}</span><span class="slds-checkbox--off" ng-if="showTexts">{{offText}}</span></span></label>',
        link: function(scope, el, attrs, ngModel){
            if(!scope.id || scope.id == ''){
                scope.id = 'slds-switch-' + ((Math.random() * (100 - 1)) + 1);
            }
            scope.descId = 'slds-switch-desc-' + ((Math.random() * (100 - 1)) + 1);
            if(!scope.onText || scope.onText == ''){
                scope.onText = 'On';
            }
            if(!scope.offText || scope.offText == ''){
                scope.offText = 'Off';
            }
            if(scope.showTexts === false){
                scope.onText = null;
                scope.offText = null;
            }

            scope.safeApply = function(fn) {
                var phase = this.$root.$$phase;
                if(phase == '$apply' || phase == '$digest') {
                    if(fn && (typeof(fn) === 'function')) {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            };
            var valueChangeCount = 0;
            var watchforvaluechange = scope.$watch(function(){
                console.log('Value changed from ' + scope.value);
                return scope.value;
            }, function(newValue, oldValue){
                if(newValue!=null && newValue != undefined){
                    scope.safeApply(function(){
                        ngModel.$setViewValue(newValue);
                        if(valueChangeCount > 1 && scope.switchChange != undefined && typeof scope.switchChange === 'function'){
                            scope.switchChange();
                        }
                        valueChangeCount++;
                    });
                }
            });
            var watchformodalvalue = scope.$watch(function(){
                return ngModel.$modelValue;
            },function(modelValue){
                if(modelValue!= null && modelValue != undefined){
                    watchformodalvalue();
                    scope.safeApply(function(){
                        scope.value = modelValue;
                        valueChangeCount++;
                    });
                }
            });
            
        }
    };
}]);
app.directive('sldsTouchSpin',['$rootScope', function($rootScope){
    return {
        require: 'ngModel',
        restrict: 'E',
        scope: {
            id: "@",
            min: "@",
            max: "@"
        },
        replace: true,
        template: '<div class="slds-form-element__control slds-grid slds-box--border"><div class="slds-align-middle slds-m-left--xx-small slds-m-right--xx-small slds-shrink-none"><button ng-click="change(0)" class="slds-button slds-button--icon-border slds-button--icon-small slds-util-button" aria-haspopup="true" title="Decrease value"><svg class="slds-button__icon" aria-hidden="true"><use xlink:href="/slds221/assets/icons/utility-sprite/svg/symbols.svg#dash"></use></svg><span class="slds-assistive-text">Decrease value</span></button></div><div class="slds-input-has-icon slds-grow"><input readonly type="number" id="{{id}}" class="slds-lookup__search-input slds-input--bare" ng-model="value" /></div><div class="slds-align-middle slds-m-left--xx-small slds-m-right--xx-small slds-shrink-none"><button ng-click="change(1)" class="slds-button slds-button--icon-border slds-button--icon-small slds-util-button" aria-haspopup="true" title="Increase value"><svg class="slds-button__icon" aria-hidden="true"><use xlink:href="/slds221/assets/icons/utility-sprite/svg/symbols.svg#add"></use></svg><span class="slds-assistive-text">Increase value</span></button></div></div>',
        link: function(scope, el, attrs, ngModel){
            if(!scope.min || scope.min == ''){
                scope.min = 0;
            }
            if(!scope.max || scope.max == ''){
                scope.max = 0;
            }
            scope.unlimited = scope.min === 0 && scope.max === 0;

            scope.safeApply = function(fn) {
                var phase = this.$root.$$phase;
                if(phase == '$apply' || phase == '$digest') {
                    if(fn && (typeof(fn) === 'function')) {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            };

            scope.change = function(flag){
                scope.safeApply(function(){
                    if(flag === 0){
                        if(scope.unlimited){
                            ngModel.$setViewValue(scope.value--);
                        }else{
                            if(scope.value > scope.min){
                                ngModel.$setViewValue(scope.value--);
                            }
                        }
                    }else if(flag === 1){
                        if(scope.unlimited){
                            ngModel.$setViewValue(scope.value++);
                        }else{
                            if(scope.value < scope.max){
                                ngModel.$setViewValue(scope.value++);
                            }
                        }
                    }
                });
            }
            var watchforvaluechange = scope.$watch(function(){
                return scope.value;
            }, function(value){
                if(value!=null && value != undefined){
                    scope.safeApply(function(){
                        ngModel.$setViewValue(value);
                    });
                }
            });
            var watchformodalvalue = scope.$watch(function(){
                return ngModel.$modelValue;
            },function(modelValue){
                if(modelValue!= null || modelValue != undefined){
                    watchformodalvalue();
                    scope.safeApply(function(){
                        scope.value = modelValue;
                    });
                }
            });
        }
    };
}]);

app.directive('sldsDropdownMenu',['$rootScope', function($rootScope){
    return {
        restrict: 'A',
        link: function(scope, el, attrs){
            console.log(el);
            $(el).each(function(){
                var self = this;
                var handler = $(this).find(".slds-button");

                if($(this).hasClass("slds-dropdown-trigger--click")){
                    $(handler).on("click",function(event){
                        $(self).toggleClass("slds-is-open");
                        event.stopPropagation();
                    });
                }
            });
            $(document).click(function(event){
                $(el).removeClass("slds-is-open");
            });
        }
    };
}]);
app.directive('sldsAccordionItem',['$rootScope', function($rootScope){
    return {
        transclude: true,
        template: '<ng-transclude></ng-transclude>',
        replace: true,
        link: function(scope, el, attrs){

        }
    };
}]);
app.directive('sldsAccordion',['$rootScope', function($rootScope){
    const sldsThemeClass = 'slds-theme--shade';
    const sldsAccordionItemClass = 'slds-accordion-item';
    return {
        transclude: true,
        template: '<ng-transclude></ng-transclude>',
        replace: true,
        link: function(scope, el, attrs){
            var focusElement = function(panel){
                $(panel).find("input.slds-lookup__search-input")[0].focus();
            }
            $(el).hide();
            setTimeout(function(){
                $(el).show();
                $(el).accordion({
                    heightStyle: "fill",
                    create: function( event, ui ) {
                        $(ui.header).addClass(sldsThemeClass);
                        $(ui.header).addClass(sldsAccordionItemClass);
                        focusElement(ui.panel);
                    },
                    beforeActivate: function( event, ui ) {
                        $(ui.oldHeader).removeClass(sldsThemeClass);
                        $(ui.newHeader).addClass(sldsThemeClass);

                        $(ui.oldHeader).removeClass(sldsAccordionItemClass);
                        $(ui.newHeader).addClass(sldsAccordionItemClass);
                    },
                    activate: function(event, ui){
                        focusElement(ui.newPanel);
                    }
                });
            },100);
        }
    };
}]);