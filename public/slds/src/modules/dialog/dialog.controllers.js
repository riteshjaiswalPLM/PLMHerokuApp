'use strict';

dialogs.controller('ConfirmDialogController',[
            '$scope','$rootScope','$element','data','close',
    function($scope , $rootScope , $element , data , close){
        $scope.title = (data.title) ? data.title : 'Confirm ?';
        $scope.yesLabel = (data.yes) ? data.yes : 'Ok';
        $scope.noLabel = (data.no) ? data.no : 'Cancel';
        $scope.message = (data.message) ? data.message : 'Are you sure ?';
        $scope.btnClass = (data.class) ? 'slds-button--' + data.class.trim() : 'slds-button--brand';
        $scope.headerClass = (data.headerClass) ? 'slds-theme--' + data.headerClass.trim() : 'slds-theme--shade';
        
        $scope.confirm = function(confirm){
            $element.modal('hide');
            close(confirm, 500);
        }
    }
]);
dialogs.controller('AlertDialogController',[
            '$scope','$rootScope','$element','data','close',
    function($scope , $rootScope , $element , data , close){
        $scope.message = (data.message) ? data.message : '';
        $scope.title = (data.title) ? data.title : 'Alert' ;
        $scope.icon = (data.icon) ? data.icon : 'info_alt';
        $scope.headerClass = ($scope.title.toLowerCase() === 'warning') ? 'slds-theme--warning' : ($scope.title.toLowerCase() === 'error') ? 'slds-theme--error' :'slds-theme--shade';
        $scope.close = function(){
            $element.modal('hide');
            close({}, 500);
        }
    }
]);