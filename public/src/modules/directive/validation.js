'use strict';

ng.directive('isCurrency', function () {
	return {
		require: 'ngModel',
		link: function (scope) {
            if(scope.field.value === undefined){
                scope.field.value = '';
            }
            var precision = scope.field.SObjectField.precision + 1;
			scope.$watch('field.value', function(newValue,oldValue) {
                var arr = String(newValue).split("");
                if (arr.length === 0) return;
                if (arr.length === 1 && (arr[0] == '-' || arr[0] === '.' )) return;
                if (arr.length === 2 && newValue === '-.') return;
                if (isNaN(newValue) || arr.length === precision) {
                    scope.field.value = oldValue;
                }
            });
		}
	};
});

ng.directive('isDouble', function () {
	return {
		require: 'ngModel',
		link: function (scope) {	
            if(scope.field.value === undefined){
                scope.field.value = '';
            }
			var precision = scope.field.SObjectField.precision + 1;
            scope.$watch('field.value', function(newValue,oldValue) {
                var arr = String(newValue).split("");
                if (arr.length === 0) return;
                if (arr.length === 1 && (arr[0] == '-' || arr[0] === '.' )) return;
                if (arr.length === 2 && newValue === '-.') return;
                if (isNaN(newValue) || arr.length === precision) {
                    scope.field.value = oldValue;
                }
            });
		}
	};
});

ng.directive('isNumber', function(){
	return {
		require: 'ngModel',
		link: function(scope, element, attrs, modelCtrl) {
			modelCtrl.$parsers.push(function (inputValue) {
				if (inputValue == undefined) return '' 
				var transformedInput = inputValue.replace(/[^1-5]/g, ''); 
				if (transformedInput!=inputValue) {
					modelCtrl.$setViewValue(transformedInput);
					modelCtrl.$render();
				}         
				return transformedInput;         
			});
		}
	};
});