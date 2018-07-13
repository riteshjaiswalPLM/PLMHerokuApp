'use strict';

client.controller('UploadAttachmentArchivalController',
	['$scope', '$log', '$rootScope', 'Upload', '$http', 'blockUI', '$stateParams', 'ModalService', '$dialog', '$clientLookups',
		function ($scope, $log, $rootScope, Upload, $http, blockUI, $stateParams, ModalService, $dialog, $clientLookups) {
			
			var AttachmentBlock = blockUI.instances.get('AttachmentBlock');
			var uploadedFiles = 0;

			$scope.getUploadedFiles = function () {
				
				var sObjectData = {
					parentId: $scope.ctrl.stateParamData.parentRecord.id,
					name: $scope.ctrl.stateParamData.parentRecord.name,
					dataModel: $scope.ctrl.dataModel
				}
				AttachmentBlock.start('Fetching uploaded file list.');
				debugger;
				$http.post("/api/service/archivalcomponent/uploadedfilelist", sObjectData)
					.success(function (response) {
						if (response.success) {
							$scope.attachments = response.data?response.data.attachments:response.data;
							$scope.section.rendered = $scope.section.rendered && response.render;
							
						}
						else {
							$dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
						}
						AttachmentBlock.stop();
					})
					.error(function () {
						$dialog.alert('Server error occured while loading details.', 'Error', 'pficon pficon-error-circle-o');
					});
			};

			$scope.getFileData = function (path) {
				var attachmentData = {
					path: path
				}
				AttachmentBlock.start('Loading file...');
				$http.post("/api/service/archivalcomponent/getfiledata", attachmentData, { cache: true, responseType: 'arraybuffer' })
					.success(function (response, status, headers, config) {
						AttachmentBlock.stop();
						var objectUrl = URL.createObjectURL(new Blob([response], { type: headers()['content-type'] }));
						if (navigator.appVersion.toString().indexOf('.NET') > 0 || navigator.userAgent.toString().indexOf('MSIE') != -1) { // for IE browser
							window.navigator.msSaveBlob(new Blob([response], { type: headers()['content-type'] }), decodeURI(name));
						} else { // for other browsers
							var a = $("<a style='display: none;'/>");
							a.attr("href", objectUrl);
							a.attr("download", decodeURI(path.substring(path.lastIndexOf('/') + 1)));
							$("body").append(a);
							a[0].click();
							a.remove();
						}
					}).error(function () { AttachmentBlock.stop() });
			};


			$scope.initComponent = function () {
				$scope.section.show=false;
				$scope.errFiles = [];
				if ($scope.files == null || angular.isUndefined($scope.files)) {
					$scope.files = [];
				}
				$scope.currentUser = JSON.parse($rootScope.user().userdata).Id;
				$scope.allowedExtentions = [];
				$scope.disablePrimaryDocuent = false;
				$scope.primaryDoc = {};
				$scope.primaryDoc.primaryDocument;
				$scope.primaryFileName = "";
				$scope.attachmentDetails = {};
				$scope.allowedSize = $scope.section.Component.ComponentDetails[0].configuration.allowedSize;
				$scope.allowedExt = $scope.section.Component.ComponentDetails[0].configuration.allowedExt;
				$scope.allowedExtForPrime = $scope.section.Component.ComponentDetails[0].configuration.allowedExtForPrime;
				$scope.allowAttachPrime = $scope.section.Component.ComponentDetails[0].configuration.allowAttachPrime;
				if ($scope.type == 'detail')
					$scope.typeNew = undefined;
				if ($scope.type !== 'create') {
					if (($scope.type == 'detail') && $scope.typeNew == undefined)
						$scope.getUploadedFiles();
				}
				$scope.UploadAttachmentArchivalController = this;
				console.log($scope.section.title + " UploadAttachmentsComponentController Initializing...");
			};

			$scope.initComponent();
		}
	]);