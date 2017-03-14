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