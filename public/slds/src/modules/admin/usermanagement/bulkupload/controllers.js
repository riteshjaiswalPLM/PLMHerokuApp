'use strict';

admin.controller('AdminUserManageBulkUploadController', [
    '$scope', '$rootScope', '$state', '$stateParams', 'userUploadService', 'blockUI', '$dialog',
    function ($scope, $rootScope, $state, $stateParams, userUploadService, blockUI, $dialog) {

        $scope.getUploadHistory = function () {
            $scope.blockUI.userUpload.start('Loading ...');
            userUploadService.getUploadHistory()
                .success(function (response) {
                    $scope.blockUI.userUpload.stop();
                    if (response.success) {
                        $scope.historyRecords = response.data.historyRecords;
                    }
                    else {
                        $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                    }
                })
                .error(function (response) {
                    $scope.blockUI.userUpload.stop();
                    $dialog.alert('Error occured while loading upload history.', 'Error', 'pficon pficon-error-circle-o');
                });
        };

        $scope.csvToJSON = function (csv) {
            var lines = csv.replace(/\"/g, "").replace(/\r/g, "").split("\n");
            var result = [];
            if (lines.length > 1) {
                var headers = lines[0].split(",");
                for (var i = 1; i < lines.length; i++) {
                    var obj = {};
                    var currentline = lines[i].split(",");
                    for (var j = 0; j < headers.length; j++) {
                        if (currentline[j] === undefined) {
                            currentline[j] = "";
                        }
                    }
                    if (currentline.length > 0) {
                        for (var j = 0; j < headers.length; j++) {
                            if (currentline[j] === "null") {
                                obj[headers[j]] = null;
                            }
                            // else if (currentline[j] === "") {
                            //     if (!ignoreBlank) {
                            //         obj[headers[j]] = "";
                            //     }
                            // }
                            else {
                                obj[headers[j]] = currentline[j];
                            }
                        }
                        result.push(obj);
                    }
                }
            }
            return result;
        };

        $scope.uploadUsers = function () {
            var name = document.getElementsByName("uploads[]")[0].value;
            $scope.upload.filename = name.substr(name.lastIndexOf("\\") + 1);

            var file = $scope.upload.userFile;
            $scope.upload.userFile = {};

            $scope.blockUI.userUpload.start('Reading file ...');
            $scope.upload.userFile = $scope.csvToJSON(file);
            if ($scope.upload.userFile.length > 0) {
                $scope.blockUI.userUpload.stop();
                $scope.blockUI.userUpload.start('Uploading ...');
                $scope.upload.username = $rootScope.user().username;

                userUploadService.uploadUsers($scope.upload)
                    .success(function (response) {
                        $scope.blockUI.userUpload.stop();
                        $scope.upload.userFile = undefined;
                        if (response.success) {
                            $dialog.alert(response.message);
                            $scope.getUploadHistory();
                        }
                        else {
                            $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                        }
                    })
                    .error(function (response) {
                        $scope.blockUI.userUpload.stop();
                        $dialog.alert('Error occured while uploading users.', 'Error', 'pficon pficon-error-circle-o');
                    });
            }
            else {
                $scope.blockUI.userUpload.stop();
                $dialog.alert("No records found in file.");
            }
        };

        $scope.getFile = function (id) {
            userUploadService.getFile({ id: id })
                .success(function (response) {
                    if (response.success) {
                        $scope.getFileData(response.data.file, response.data.filename.replace(".csv", ""));
                    }
                    else {
                        $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                    }
                })
                .error(function (response) {
                    $dialog.alert('Error occured while downloading file.', 'Error', 'pficon pficon-error-circle-o');
                });
        };

        $scope.getFileData = function (file, filename) {
            var req = { file: file };
            var res = { cache: true, responseType: 'arraybuffer' };
            userUploadService.getfiledata(req, res)
                .success(function (response, status, headers, config) {
                    var objectUrl = URL.createObjectURL(new Blob([response], { type: headers()['content-type'] }));
                    if (navigator.appVersion.toString().indexOf('.NET') > 0 || navigator.userAgent.toString().indexOf('MSIE') != -1) { // for IE browser
                        window.navigator.msSaveBlob(new Blob([response], { type: headers()['content-type'] }), filename + "_Result.csv");
                    } else { // for other browsers
                        var a = $("<a style='display: none;'/>");
                        a.attr("href", objectUrl);
                        a.attr("download", filename + "_Result.csv");
                        $("body").append(a);
                        a[0].click();
                        a.remove();
                    }

                    //Delete file from server
                    var fileObject = {
                        file: file
                    };

                    userUploadService.deleteFile(fileObject)
                        .success(function () {
                        })
                        .error(function () {
                        });
                }).error(function () {
                    $dialog.alert('Server error occured while downloading file.', 'Error', 'pficon pficon-error-circle-o');
                });
        };

        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                userUpload: blockUI.instances.get('userUpload')
            };
        };

        $scope.init = function () {
            console.log('AdminUserManageBulkUploadController loaded!');
            $scope.initBlockUiBlocks();
            $scope.getUploadHistory();
            // $scope.upload = ($stateParams.upload) ? $stateParams.upload : {
            //     name: null,
            //     code: null,
            //     active: false,
            // };
            $scope.upload = {
                filename: null,
                ignoreBlank: false
            };
            $scope.historyRecords = {};
        };
        $scope.init();
    }]);