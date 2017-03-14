'use strict';

dialogs.factory('$dialog',['ModalService',function(ModalService){
    return {
        confirm: function(data, callback){
            ModalService.showModal({
                templateUrl: 'slds/views/dialog/confirm.html',
                controller:'ConfirmDialogController',
                inputs:{
                    data: data  
                } 
            }).then(function(modal){
                // modal.element.modal();
                modal.element.modal({backdrop: 'static', keyboard: false});
                modal.close.then(function(confirm){
                    callback && callback(confirm);
                });
            });
        },
        alert: function(message,title,icon,callback){
            ModalService.showModal({
                templateUrl: 'slds/views/dialog/alert.html',
                controller:'AlertDialogController',
                inputs:{
                    data: {
                        title: title,
                        message: message,
                        icon: icon
                    }  
                }
            }).then(function(modal){
                // modal.element.modal();
                modal.element.modal({backdrop: 'static', keyboard: false});
                modal.close.then(function(result){
                    callback && callback();
                });
            });
        }
    };
}]);