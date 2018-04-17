'use strict';

client.controller('csvUploadController', [
    '$scope', '$rootScope', '$state', '$stateParams', 'invoiceUploadService', 'blockUI', '$dialog',
    function ($scope, $rootScope, $state, $stateParams, invoiceUploadService, blockUI, $dialog) {
        $scope.initBlockUiBlocks = function () {
            $scope.blockUI = {
                userUpload: blockUI.instances.get('userUpload')
            };
        };

        $scope.uploadInvoices = function () {
            var name = document.getElementsByName("uploads[]")[0].value;
            if (name.substr(name.length - 4).toLowerCase() != '.csv') {
                $dialog.alert("Please upload valid CSV file");
            } else {
                console.log('csvUploadController -> uploadInvoices...');

                $scope.upload.filename = name.substr(name.lastIndexOf("\\") + 1);
                console.log('csvUploadController -> filename : ' + $scope.upload.filename);
                var file = $scope.upload.InvoiceFile;
                $scope.upload.InvoiceFile = {};
                $scope.blockUI.userUpload.start('Reading file ...');
                $scope.upload.InvoiceFile = $scope.csvToJSON(file);
                console.log('csvUploadController -> InvoiceFile.length : ' + $scope.upload.InvoiceFile.length);
                console.log('csvUploadController -> InvoiceFile.length : ' + $scope.upload.InvoiceFile.length);

                if ($scope.upload.InvoiceFile.length > 0) {

                    $scope.blockUI.userUpload.stop();
                    $scope.blockUI.userUpload.start('Uploading ...');
                    $scope.upload.username = $rootScope.user().username;
                    for (var i = 0; i < $scope.upload.InvoiceFile.length; i++) {
                        console.log('csvUploadController -> $scope.upload.InvoiceFile[i].Invoice_Date__c 1 : ' + $scope.upload.InvoiceFile[i].Invoice_Date__c);
                        var dateString = $scope.upload.InvoiceFile[i].Invoice_Date__c;
                        var year = dateString.substring(0, 4);
                        var month = dateString.substring(4, 6);
                        var day = dateString.substring(6, 8);
                        $scope.upload.InvoiceFile[i].Invoice_Date__c = new Date(year, month - 1, day);
                        console.log('csvUploadController -> $scope.upload.InvoiceFile[i].Invoice_Date__c 2 : ' + $scope.upload.InvoiceFile[i].Invoice_Date__c);
                    }

                    console.log('csvUploadController -> $scope.upload.username : ' + $scope.upload.username);
                    console.log('csvUploadController -> $scope.upload : ' + $scope.upload);
                    invoiceUploadService.uploadInvoices($scope.upload)
                        .success(function (response) {
                            console.log('csvUploadController -> success response : ' + response);
                            $scope.blockUI.userUpload.stop();
                            $scope.upload.InvoiceFile = undefined;
                            if (response.success) {
                                $dialog.alert(response.message);
                                //$scope.getUploadHistory();
                            } else {
                                $dialog.alert(response.error, 'Error', 'pficon pficon-error-circle-o');
                            }
                        })
                        .error(function (response) {
                            console.log('csvUploadController -> error response : ' + response);
                            $scope.blockUI.userUpload.stop();
                            $dialog.alert('Error occured while uploading users.', 'Error', 'pficon pficon-error-circle-o');
                        });
                } else {
                    $scope.blockUI.userUpload.stop();
                    $dialog.alert("No records found in file.");
                }
            }
        };

        $scope.csvToJSON = function (csv) {
            console.log('csvUploadController -> csvToJSON : ' + csv);
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
                            } else {
                                obj[headers[j]] = currentline[j].trim();
                            }
                        } result.push(obj);
                    }
                }
            } return result;
        };

        $scope.createInvoice = function () {
            console.log('csvUploadController -> createInvoice...');
            invoiceUploadService.save()
                .success(function (response) {
                    if (response.success) {
                        console.log('csvUploadController -> success...');
                    } else {
                        $dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
                    }
                });
        };

        $scope.init = function () {
            console.log('csvUploadController loaded!');
            $scope.initBlockUiBlocks();
            $scope.upload = {
                filename: null,
            };
            $scope.historyRecords = {};
        };
        $scope.init();
    }]);