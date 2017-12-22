'use strict';

var clientLookup = angular.module('app.client.lookups', []);

clientLookup.controller('UploadAttachmentModalController', [
    '$scope', '$controller', '$element', 'data', 'blockUI', '$http', '$dialog', 'close',
    function ($scope, $controller, $element, data, blockUI, $http, $dialog, close) {

        var AttachmentBlock = blockUI.instances.get('AttachmentBlock');

        $scope.close = function () {
            $element.modal('hide');
        };

        $scope.save = function () {
            $scope.data.uploadAttachmentErrors = [];

            var uploadedFiles = 0;
            var notPersistedFileList = "";

            angular.forEach($scope.data.files, function (file) {
                if (!file.isPersisted) {
                    notPersistedFileList += file.name + ",";
                }
                else {
                    uploadedFiles++;
                }
            });

            if (notPersistedFileList.length > 0) {
                $dialog.alert(notPersistedFileList + ' not uploaded. Please upload it either remove it.', 'Error', 'pficon pficon-error-circle-o');
                AttachmentBlock.stop();
                return;
            }


            AttachmentBlock.start("Saving Attachments ...");

            if (uploadedFiles > 0 && uploadedFiles == $scope.data.files.length) {
                $scope.data.attachmentDetails.files = $scope.data.files;
                $scope.data.attachmentDetails.id = $scope.data.ctrl.stateParamData.record.Id;
                $http.post("api/service/component/savepopupattachment", $scope.data.attachmentDetails)
                    .success(function (response) {
                        if (response.success) {
                            $scope.data.files = [];
                            $dialog.alert('Files saved successfully.', '', '');
                            $element.modal('hide');
                            close();
                        } else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                        AttachmentBlock.stop();
                    })
                    .error(function () {
                        $dialog.alert('Server error occured while saving files.', 'Error', 'pficon pficon-error-circle-o');
                        AttachmentBlock.stop();
                    });
            }
            else {
                $dialog.alert('No files uploaded!!', 'Error', 'pficon pficon-error-circle-o');
                AttachmentBlock.stop();
            }
            $element.modal('hide');
        };

        $scope.saveAttachments = function () {

        };

        $scope.initModalController = function () {
            $scope.data = data.data;
            $scope.data.customMessageForPopup = [];
            $scope.data.customMessageForPopup.push('Note : Please limit your files to a maximum of ' + $scope.data.allowedSize + 'MB in size.');
            var tmp = '';
            if ($scope.data.customMessage) {
                tmp = $scope.data.customMessage.split('<br>');
            }
            angular.forEach(tmp, function (message) {
                $scope.data.customMessageForPopup.push(message);
            });
            console.info('ClientDetailsLayoutController loaded!');
        };

        $scope.initModalController();
    }
]);
clientLookup.factory('$clientLookups', ['ModalService', function (ModalService) {
    return {
        attachment: function (data, callback) {
            ModalService.showModal({
                templateUrl: 'slds/views/client/layout/component/upattachmentmodal.html',
                controller: 'UploadAttachmentModalController',
                inputs: {
                    data: data
                }
            }).then(function (modal) {
                modal.element.modal();
                modal.close.then(function () {
                    callback && callback();
                });
            });
        },
        bulk: function (multipleApprove, callback) {
            ModalService.showModal({
                templateUrl: 'slds/views/client/multipleApprove.html',
                controller: 'BulkOperationController',
                inputs: {
                    data: multipleApprove
                }

            }).then(function (modal) {
                modal.element.modal();
                modal.close.then(function () {
                    callback && callback();
                });
            });
        }
    };
}]);
clientLookup.controller('BulkOperationController', [
    '$scope', '$controller', '$element', 'data', 'blockUI', '$http', '$dialog', 'close', '$timeout', '$rootScope','clientSObjectService',
    function ($scope, $controller, $element, data, blockUI, $http, $dialog, close, $timeout, $rootScope,clientSObjectService) {
        $scope.close = function () {
            $element.modal('hide');
        };
        $scope.save = function () {
            console.log('data', data);
            var componentSaveCall = [];
            var queryObject = {
                operation: null,
                sObject: {
                    name: $scope.detailSobjectName == null ? $scope.sObjectName : $scope.detailSobjectName,
                    data: null
                }
            }
            var sObjectData = {

            };
            queryObject.multipleIds = data.dataModel;
            var allSObjectData = {
                Id: data.dataModel
            };

            var dataFields = [];

            angular.forEach($scope.data, function (field, fieldIndex) {
                if (field.SObjectField.custom === true && field.readonly === false && field.rendered != undefined && field.rendered === true) {
                    sObjectData[field.SObjectField.name] = field.value;
                    dataFields.push(field);
                }
            });
            queryObject.sObject.data = sObjectData;
            console.log('sObjectData', sObjectData);
            console.log('queryObject', queryObject);
            queryObject.operation = "UPDATE";
            clientSObjectService.isRequireValidation({ sObjectData: sObjectData, fields: dataFields }, function (result) {
                if (result.success) {
                    $scope.blockUI.layoutBlock.start("Saving layout...");
                    clientSObjectService.multipleApproveSave(queryObject)
                        .success(function (response) {
                            $scope.blockUI.layoutBlock.stop();
                            if (response.success) {
                            } else {
                                $dialog.alert(response.message, 'Validation Alert', 'pficon-warning-triangle-o');
                            }
                            $element.modal('hide');
                            close(response, 100);
                        })
                        .error(function (response) {
                            $element.modal('hide');
                            close(response, 100);
                            $dialog.alert('Server error occured while saving details.', 'Error', 'pficon pficon-error-circle-o');
                            $scope.blockUI.layoutBlock.stop();
                        });
                }
                else {
                    $dialog.alert(result.message, 'Validation Alert', 'pficon-warning-triangle-o');
                }
            });
        }
        $scope.executeEvent = function (event, paramValues) {
            $rootScope.eventName = event;
            switch (event) {
                case 'reloadLayout': $scope.reloadLayout(paramValues); break;
            }
        };
        $scope.reloadLayout = function (paramValues) {
            $scope.blockUI.layoutBlock.start("Loading layout...");
            var sObjectLayoutSections = angular.copy($scope.data);
            sObjectLayoutSections.push({});
            $timeout(function () {
                sObjectLayoutSections.pop();
                angular.forEach($scope.data, function (field, index) {
                    field.rendered = true;
                    $scope.data[index] = angular.copy(field);
                });
                $scope.blockUI.layoutBlock.stop();
            }, 100);
        };

        $scope.initModalController = function () {
            $scope.bulkOperationTitle=data.bulkOperationTitle;
            $scope.data = data.data;
            $scope.model = data.model;
            $scope.detailSobjectName = data.detailSobjectName;
            $scope.sObjectName = data.sObjectName;
            $scope.blockUI = {
                layoutBlock: blockUI.instances.get('saveMultiUserAction')
            };
            $scope.baseCtrl = this;
            console.info('BulkOperationController loaded!');
            $scope.dataModel = {};
            $scope.templateURLs = $scope.section.Component.ComponentDetails[0].configuration.templateURLs ? $scope.section.Component.ComponentDetails[0].configuration.templateURLs.split(',') : $scope.section.Component.ComponentDetails[0].configuration.templateURLs;
			$scope.urlTexts = $scope.section.Component.ComponentDetails[0].configuration.urlTexts ? $scope.section.Component.ComponentDetails[0].configuration.urlTexts.split(',') : $scope.section.Component.ComponentDetails[0].configuration.urlTexts;
			$scope.URLTextsResult = [];
			$scope.allowedExtForPrime = $scope.section.Component.ComponentDetails[0].configuration.allowedExtForPrime;
			$scope.allowAttachPrime = $scope.section.Component.ComponentDetails[0].configuration.allowAttachPrime;
			if ($scope.templateURLs != undefined && $scope.urlTexts != undefined) {
				angular.forEach($scope.templateURLs, function (tmpUrl) {
					$scope.URLTextsResult.push({
						'url': tmpUrl
					});
				});
				angular.forEach($scope.urlTexts, function (tmpUrlTxt, index) {
					$scope.URLTextsResult[index].urlText = tmpUrlTxt;
				});
			}
        };
        $scope.initModalController();
    }
]);
