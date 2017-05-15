'use strict';

client.controller('UploadAttachmentController',
		[	'$scope','$log','$rootScope','Upload','$http','blockUI','$stateParams','ModalService','$dialog','$clientLookups',
	function($scope , $log ,$rootScope, Upload , $http , blockUI , $stateParams , ModalService , $dialog , $clientLookups){
			
		var AttachmentBlock = blockUI.instances.get('AttachmentBlock');
		var uploadedFiles=0;
        
		$scope.getUploadedFiles = function (){
			var sObjectData = {
				parentId: $scope.ctrl.stateParamData.record.Id
			}
			AttachmentBlock.start('Fetching uploaded file list.');
			$http.post("/api/service/component/uploadedfilelist", sObjectData)
	    		.success(function(response){
					if(response.success){
						$scope.attachments = response.data.attachments;
					} 
					else {
						$dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
					}
					AttachmentBlock.stop();
				})
				.error(function() {
					$dialog.alert('Server error occured while loading details.','Error','pficon pficon-error-circle-o');
				});
		};
		
		$scope.getFileData = function(name, body){
			var attachmentData = {
				name: name,
				body: body
			}
			AttachmentBlock.start('Loading file...');
			$http.post("/api/service/component/getfiledata", attachmentData, {cache: true, responseType:'arraybuffer'})
				.success(function(response, status, headers, config){
					AttachmentBlock.stop();
					var objectUrl = URL.createObjectURL(new Blob([response], {type: headers()['content-type']}));
					if (navigator.appVersion.toString().indexOf('.NET') > 0 || navigator.userAgent.toString().indexOf('MSIE') != -1) { // for IE browser
						window.navigator.msSaveBlob(new Blob([response], {type: headers()['content-type']}), decodeURI(name));
					} else { // for other browsers
						var a = $("<a style='display: none;'/>");
						a.attr("href", objectUrl);
						a.attr("download", decodeURI(name));
						$("body").append(a);
						a[0].click();
						// window.URL.revokeObjectURL(objectUrl);
						a.remove();
					}
				}).error(function(){AttachmentBlock.stop()});
		};

		$scope.selectFile = function(files, errFiles) {
			var blackListedFiles="";
			var sizeExceededFiles="";
			if($scope.primaryDoc.primaryDocument)
			{
				$scope.allowedExtentions=[];
				angular.forEach($scope.allowedExtForPrime.split(','),function(ext){
					$scope.allowedExtentions.push(ext);
				});
			}
			else
			{
				$scope.allowedExtentions=[];
				angular.forEach($scope.allowedExt.split(','),function(ext){
					$scope.allowedExtentions.push(ext);
				});
			}
			angular.forEach(files,function(file){
        		if(($scope.allowedExtentions.indexOf(file.name.toLowerCase().substr(file.name.lastIndexOf("."),file.name.length - 1)) > -1) && (file.size/(1024*1024) <= $scope.allowedSize))
        		{
        			file.isPersisted = false;
	        		var pushOnScope = true;
	        		angular.forEach($scope.files,function(fileInScope){
	        			if(fileInScope.name == file.name)
        				{
	        				pushOnScope = false;
	        				if($scope.primaryDoc.primaryDocument  && $scope.primaryFileName == "" && fileInScope.name == file.name)
	        					fileInScope.primaryDocument = true;
		        			else
		        				fileInScope.primaryDocument = false;
	        				return;
        				}
	        			return;
		        	});
	        		if($scope.primaryDoc.primaryDocument && $scope.primaryFileName == "")
	        		{
	        			$scope.primaryFileName = file.name;
	        			$scope.disablePrimaryDocuent = true;
	        			$scope.primaryDoc.primaryDocument = false;
	        		}
	        		if(pushOnScope)
        			{
	        			if($scope.primaryDoc.primaryDocument && $scope.primaryFileName == file.name)
	        				file.primaryDocument = true;
	        			else
	        				file.primaryDocument = false;
	        			$scope.files.push(file);
        			}
        		}
        		else
    			{
        			blackListedFiles += file.name + ",";
    			}
        	});

			if(blackListedFiles.length > 0)
			{
				$dialog.alert('Extention is black listed for ' + blackListedFiles,'Validation Alert','pficon-warning-triangle-o');
			}
	        	
	        	
        	angular.forEach(errFiles,function(errFile){
        		sizeExceededFiles += errFile.name + ","
        	});
        	
        	if(sizeExceededFiles.length > 0)
        	{
				$dialog.alert('Error occured, may be size limit exceeded for files ' + sizeExceededFiles,'Error','pficon pficon-error-circle-o');
        	}
		};
	    
		$scope.primaryDocumentClicked = function(primaryDoc){
			$scope.primaryDoc.primaryDocument = primaryDoc;
		};
		
	    $scope.attachFiles = function(files)
	    {
	    	AttachmentBlock.start("Attaching File...");
	        angular.forEach($scope.files, function(file) {
	        	if(files == file)
        		{
	        		var response;
		        	if(file.name != $scope.primaryFileName)
	        		{
						file.isPrimary = false;
	        		}
		        	else
	        		{
						file.isPrimary = true;
	        		}
					$scope.uploadAttachments(file)
						.then(function(response){
							if(response.data.success)
							{
								file.fileName = response.data.fileName;
								file.originalFileName = file.name;
								file.fileType = file.type;
								file.isPersisted = true;
								$dialog.alert(file.name + ' File Uploaded successfully.','','')
							}
							else
							{
								$dialog.alert(file.name + ' upload failed.','Error','pficon pficon-error-circle-o');
							}
							AttachmentBlock.stop();
						});
        		}
	        });
	    };
	    $scope.deleteAttachment = function(attachment){
			
			$dialog.confirm({
                title: 'Confirm delete ?',
                yes: 'Yes, Delete', no: 'Cancel',
                message: 'Are you sure to delete file  "'+ attachment.Name +'" ? This action can not be undo.',
                class:'danger'
            },function(confirm){
                if(confirm){
				AttachmentBlock.start('Deleting file...');
				$http.post("/api/service/component/deleteexistingattachment", attachment)
					.success(function(response){
						if(response.success){
							attachment.IsDeleted=true;
							$dialog.alert(response.filename + ' deleted successfully.','','')
						} 
						else {
							$dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
						}
						AttachmentBlock.stop();
					});
			}});
			
		}
	    $scope.deleteFile = function(file)
	    {
	    	var index = $scope.files.indexOf(file);
			if(file.fileName){
				AttachmentBlock.start("Deleting File...");
				
				var dataObj = {
					fileName : file.fileName,
				};
				
				$http.post("/api/service/component/deletefile", dataObj)
				.success(function(response){
					if(response.success){
						if($scope.primaryFileName == file.name)
						{
							$scope.disablePrimaryDocuent = false;
							$scope.primaryFileName = "";
							$scope.primaryDoc.primaryDocument = false;
						}
						if(index > -1)
						{
							$scope.files.splice(index,1);
						}
						$dialog.alert(file.name + ' deleted successfully.','','')
					} 
					else {
						$dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
					}
					AttachmentBlock.stop();
				});
			}
			else{
				if($scope.primaryFileName == file.name)
				{
					$scope.disablePrimaryDocuent = false;
					$scope.primaryFileName = "";
					$scope.primaryDoc.primaryDocument = false;
				}
				if(index > -1)
				{
					$scope.files.splice(index,1);
				}
				$dialog.alert(file.name + ' deleted successfully.','','')
			}
	    }
	  
		$scope.openAttachmentLookup = function(){
			$scope.typeNew = 'editUpload';
            $clientLookups.attachment({data:$scope}, function(){
			// $clientLookups.attachment($scope.uploadAttachmentController, function(){
                $scope.getUploadedFiles();
            });
        };
		
		$scope.close = function(){
            angular.element.modal('hide');
        };
	    
	    $scope.uploadAttachments = function(file){
            file.upload = Upload.upload({
                url: '/api/service/component/upload',
                data: {file: file}
            })
            return file.upload;
		};
		
		$scope.initComponent = function(){
			$scope.errFiles = [];
		//	$scope.files = $scope.files == null ? [] : $scope.files ;
			if($scope.files == null || angular.isUndefined($scope.files)){
				$scope.files = [];
			}
			$scope.currentUser=JSON.parse($rootScope.user().userdata).Id;
			$scope.allowedExtentions = [];
			$scope.disablePrimaryDocuent = false;
			$scope.primaryDoc={};
			$scope.primaryDoc.primaryDocument;
			$scope.primaryFileName = "";
			$scope.attachmentDetails = {};
			$scope.allowedSize = $scope.section.Component.ComponentDetails[0].configuration.allowedSize;
			$scope.allowedExt = $scope.section.Component.ComponentDetails[0].configuration.allowedExt;
			$scope.allowedExtForPrime = $scope.section.Component.ComponentDetails[0].configuration.allowedExtForPrime;
			$scope.allowAttachPrime = $scope.section.Component.ComponentDetails[0].configuration.allowAttachPrime;
			if($scope.type == 'detail')
				$scope.typeNew = undefined;
			if($scope.type !== 'create'){
				if(($scope.type == 'detail' || $scope.type == 'edit') && $scope.typeNew == undefined)
					$scope.getUploadedFiles();
			}
			$scope.uploadAttachmentController = this;
			console.log( $scope.section.title +" UploadAttachmentsComponentController Initializing...");
		};
		
		$scope.initComponent();
	}
]);