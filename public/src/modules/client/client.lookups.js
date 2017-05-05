'use strict';

var clientLookup = angular.module('app.client.lookups',[]);

clientLookup.controller('UploadAttachmentModalController',[
            '$scope','$controller','$element','data','blockUI','$http','$dialog','close',
    function($scope , $controller , $element , data , blockUI , $http , $dialog , close){
        
        var AttachmentBlock = blockUI.instances.get('AttachmentBlock');

        $scope.close = function(){
            $element.modal('hide');
        };

        $scope.save = function(){
            $scope.data.uploadAttachmentErrors=[];
	    	
			var uploadedFiles=0;
			var notPersistedFileList="";
			
			angular.forEach($scope.data.files,function(file){
	    		if(!file.isPersisted)
    			{
	    			notPersistedFileList += file.name + ",";
    			}
	    		else
    			{
	    			uploadedFiles++;
    			}
	    	});
    		
	    	if(notPersistedFileList.length > 0)
    		{
                $dialog.alert(notPersistedFileList + ' not uploaded. Please upload it either remove it.','Error','pficon pficon-error-circle-o');
		    	AttachmentBlock.stop();
		    	return;
    		}
	 
	    	
            AttachmentBlock.start("Saving Attachments ...");
    
	    	if(uploadedFiles > 0 && uploadedFiles == $scope.data.files.length)
	    	{
	    		$scope.data.attachmentDetails.files = $scope.data.files; 
		    	$scope.data.attachmentDetails.id= $scope.data.ctrl.stateParamData.record.Id;
		    	$http.post("api/service/component/savepopupattachment", $scope.data.attachmentDetails)
					.success(function(response){
						if(response.success){
                            $scope.data.files = [];
							$dialog.alert('Files saved successfully.','','');
                            $element.modal('hide');
                            close();
						}else{
							$dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
						}
						AttachmentBlock.stop();
					})
					.error(function(){
						$dialog.alert('Server error occured while saving files.','Error','pficon pficon-error-circle-o');
						AttachmentBlock.stop();
                    });
            }
	    	else{
                $dialog.alert('No files uploaded!!','Error','pficon pficon-error-circle-o');
	    		AttachmentBlock.stop();
	    	}
            $element.modal('hide');
        };

        $scope.saveAttachments = function(){
	    	
	    };

        $scope.initModalController = function(){
            $scope.data = data.data;
            console.info('ClientDetailsLayoutController loaded!');
        };

        $scope.initModalController();
    }
]);

clientLookup.factory('$clientLookups',['ModalService',function(ModalService){
    return {
        attachment: function(data, callback){
            ModalService.showModal({
                templateUrl: 'views/client/layout/component/upattachmentmodal.html',
                controller:'UploadAttachmentModalController',
                inputs:{
                    data: data  
                }
            }).then(function(modal){
                modal.element.modal();
                modal.close.then(function(){
                    callback && callback();
                });
            });
        }
    };
}]);