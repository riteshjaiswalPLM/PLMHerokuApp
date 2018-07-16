'use strict';
admin.controller('AdminSetupLogoConfigController',['$scope','Upload','$rootScope','$state','$http','blockUI','mobileOrgDetailService','$dialog',
    function($scope,Upload,$rootScope,$state,$http,blockUI,mobileOrgDetailService,$dialog){
    $scope.selectFile = function(files, errFiles,forLogo) {

        var file=undefined;
        if(files.length>0){
            file=files[0];
        }
        if(file !=undefined && (($scope.allowedExtList.indexOf(file.name.toLowerCase().substr(file.name.lastIndexOf("."),file.name.length - 1)) > -1) ))
        {
            if (file.size > 102400) {
                $dialog.alert('Maximum 100 KB file size is allowed.', 'Error', 'pficon pficon-error-circle-o');
            }
            else {
                if(forLogo=='Home'){
                    if(!$scope.blockUI.loadOrgDetail.state().blocking){
                        $scope.blockUI.loadOrgDetail.start('Uploading Home Page Logo...');
                        Upload.upload({
                            url: '/api/admin/setup/logoconfig/homelogo',
                            data: {file: file}
                        }).then(function(response){
                            if(response.data.success)
                            {
                                $scope.blockUI.loadOrgDetail.stop();
                                // $dialog.alert('Logo Uploaded Successfully');
                                $scope.tempHomeLogoImg=$scope.homeLogoImg+new Date().getTime();
                            }
                            else
                            {
                                $dialog.alert(file.name + ' upload failed.','Error','pficon pficon-error-circle-o');
                            }
                        });
                    }
                }
                else if(forLogo=='Header'){
                    if(!$scope.blockUI.loadOrgDetail.state().blocking){
                        $scope.blockUI.loadOrgDetail.start('Uploading Header Logo...');
                        Upload.upload({
                            url: '/api/admin/setup/logoconfig/headerlogo',
                            data: {file: file}
                        }).then(function(response){
                            if(response.data.success)
                            {
                                $scope.blockUI.loadOrgDetail.stop();
                                // $dialog.alert('Logo Uploaded Successfully');
                                $scope.tempHeaderLogoImg=$scope.headerLogoImg+new Date().getTime();;
                                
                            }
                            else
                            {
                                $dialog.alert(file.name + ' upload failed.','Error','pficon pficon-error-circle-o');
                            }
                        });
                    }
                }
            }
        }
        else if(file !=undefined)
        {
            $dialog.alert('Only '+$scope.allowedExtList +' file format supported.','Error','pficon pficon-error-circle-o');
        }
    };
    
    $scope.initBlockUiBlocks = function(){
        $scope.blockUI = {
            loadOrgDetail: blockUI.instances.get('loadOrgDetail') 
        }; 
    };
    $scope.init = function(){
        console.log('AdminSetupLogoConfigController loaded!');
        $scope.initBlockUiBlocks();
        $scope.allowedExtList=".png";
        $scope.allowedExt=$scope.allowedExtList.split(',');
        $scope.headerLogoImg='resources/images/logo/headerLogo.png?tls=';
        $scope.homeLogoImg='resources/images/homeLogo.png?tls=';
        $scope.tempHeaderLogoImg=$scope.headerLogoImg;
        $scope.tempHomeLogoImg=$scope.homeLogoImg;

    };
    $scope.init();
}]);

