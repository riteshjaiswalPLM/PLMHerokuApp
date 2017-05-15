'use strict';
admin.controller('AdminMobileOrgDetailController',['$scope','Upload','$rootScope','$state','$http','blockUI','mobileOrgDetailService','$dialog',
    function($scope,Upload,$rootScope,$state,$http,blockUI,mobileOrgDetailService,$dialog){
    $scope.loadOrgDetail = function(){
        if(!$scope.blockUI.loadOrgDetail.state().blocking){
            $scope.blockUI.loadOrgDetail.start('Loading Org Detail...');
            mobileOrgDetailService.loadOrgDetail({})
            .success(function(response){
                if(response.success === true){
                    $scope.orgDetailConfig=response.data;
                }else{
                    $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                }
                $scope.blockUI.loadOrgDetail.stop();
            })
            .error(function(response){
                $dialog.alert('Error occured while saving Org Detail.','Error','pficon pficon-error-circle-o');
                $scope.blockUI.loadOrgDetail.stop();
            });
        }
    }
    $scope.edit = function(editable){
        $scope.logofile=undefined;
        if(editable){
            $scope.orgDetailConfigCopy = angular.copy($scope.orgDetailConfig);
        }else{
            $scope.orgDetailConfig = $scope.orgDetailConfigCopy;
        }
        $scope.enableEdit = editable;
    }
    $scope.save = function(){
        if($scope.orgDetailConfig ===undefined || $scope.orgDetailConfig.name === undefined || $scope.orgDetailConfig.name.trim() === "" ){
            //$dialog.alert("Please Enter Name",'Error','pficon pficon-error-circle-o');
            return false;
        }
        if($scope.orgDetailConfig ===undefined || $scope.orgDetailConfig.sysAdminId == undefined || $scope.orgDetailConfig.sysAdminId.trim() === "" ){
            //$dialog.alert("Please Enter sysAdminId",'Error','pficon pficon-error-circle-o');
            return false;
        }
        $scope.enableEdit = false;
        if(!$scope.blockUI.loadOrgDetail.state().blocking){
            $scope.blockUI.loadOrgDetail.start('Saving Mobile Org Detail...');
            $scope.orgDetailConfig.logofile= $scope.logofile;
            if($scope.logofile !== undefined){
                Upload.upload({
                    url: '/api/admin/orgdetails/upload',
                    data: {file: $scope.orgDetailConfig.logofile}
                }).then(function(response){
                    if(response.data.success)
                    {
                        $scope.orgDetailConfig.logofile.fileName = response.data.fileName;
                        $scope.orgDetailConfig.logofile.originalFileName = $scope.orgDetailConfig.logofile.name;
                        $scope.orgDetailConfig.logofile.fileType = $scope.orgDetailConfig.logofile.type;

                        mobileOrgDetailService.saveOrgDetail($scope.orgDetailConfig)
                        .success(function(response){
                            if(response.success === true){
                                $scope.blockUI.loadOrgDetail.stop();
                                $scope.loadOrgDetail();
                            }else{
                                $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                                $scope.blockUI.loadOrgDetail.stop();
                            }
                            
                        })
                        .error(function(response){
                            $dialog.alert('Error occured while saving mobile org Detail.','Error','pficon pficon-error-circle-o');
                            $scope.blockUI.loadOrgDetail.stop();
                        });
                    }
                    else
                    {
                        $dialog.alert(file.name + ' upload failed.','Error','pficon pficon-error-circle-o');
                    }
                    AttachmentBlock.stop();
                });
            }
            else{
                 mobileOrgDetailService.saveOrgDetail($scope.orgDetailConfig)
                    .success(function(response){
                        if(response.success === true){
                            $scope.blockUI.loadOrgDetail.stop();
                            $scope.loadOrgDetail();
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                            $scope.blockUI.loadOrgDetail.stop();
                        }
                        
                    })
                    .error(function(response){
                        $dialog.alert('Error occured while saving mobile org Detail.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.loadOrgDetail.stop();
                    });
            }
            
            
            
        }
    }
    $scope.selectFile = function(files, errFiles) {
        var file=undefined;
        if(files.length>0){
            file=files[0];
        }
        if(file !=undefined && (($scope.allowedExtList.indexOf(file.name.toLowerCase().substr(file.name.indexOf("."),file.name.length - 1)) > -1) ))
        {
            $scope.logofile=file;
        }
        else
        {
            $scope.logofile=undefined;
            $dialog.alert('Only '+$scope.allowedExtList +' file format supported ','Error','pficon pficon-error-circle-o');
        }
    };
    $scope.initBlockUiBlocks = function(){
        $scope.blockUI = {
            loadOrgDetail: blockUI.instances.get('loadOrgDetail') 
        }; 
    };
    $scope.init = function(){
        console.log('AdminMobileOrgDetailController loaded!');
        $scope.initBlockUiBlocks();
        $scope.enableEdit = false;
        $scope.loadOrgDetail();
        $scope.orgDetailConfig={};
        $scope.allowedExtList=".png,.jpg,.jpeg,.gif,.bmp";
        $scope.allowedExt=$scope.allowedExtList.split(',');
        $scope.logofile=undefined;

    };
    $scope.init();
}]);

