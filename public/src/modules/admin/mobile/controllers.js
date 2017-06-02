'use strict';

admin.controller('AdminMobileSObjectsController',['$scope','$rootScope','$state',function($scope,$rootScope,$state){
    $scope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        if(toState.name === 'admin.mobile.sobjects' && fromState !== 'admin.mobile.sobjects.list'){
            event.preventDefault();
            $state.go('admin.mobile.sobjects.list');
        }
    });
    $scope.init = function(){
        console.log('AdminMobileSObjectsController loaded!');
        $state.go('admin.mobile.sobjects.list');
    };
    $scope.init();
}]);

admin.controller('AdminMobileSObjectsListController',[
            '$scope','$state','mobileSobjectService','blockUI','$dialog','$filter',
    function($scope , $state , mobileSobjectService , blockUI , $dialog,$filter){
    
    $scope.loadSObjects = function(){
        if(!$scope.blockUI.loadSObjects.state().blocking){
            $scope.blockUI.loadSObjects.start('Loading local sobjects...');
            mobileSobjectService.loadSObjects({})
                .success(function(response){
                    if(response.success){
                        $scope.sObjects = $filter('filter')(response.data.sObjects, {forMobile:true});
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                    $scope.blockUI.loadSObjects.stop();
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading local sobjects.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.loadSObjects.stop();
                });
        }
    };
    $scope.deleteSObject = function(sObject){
        $dialog.confirm({
            title: 'Confirm delete ?',
            yes: 'Yes, Delete', no: 'Cancel',
            message: 'All information related to '+ sObject.label +' will be deleted. \nAre you sure ?',
            class:'danger'
        },function(confirm){
            if(confirm){
                $scope.blockUI.loadSObjects.start('Deleting '+ sObject.label +'...');
                sObject.forMobile=false;
                mobileSobjectService.updateSObject(sObject)
                    .success(function(response){
                        $scope.blockUI.loadSObjects.stop();
                        if(response.success){
                            $scope.loadSObjects();
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                    })
                    .error(function (response) {
                        $scope.blockUI.loadSObjects.stop();
                        $dialog.alert('Error occured while deleting sObject.','Error','pficon pficon-error-circle-o');
                    });
            }
        });
    }
    $scope.viewSObject = function(sObject){
        $state.go('admin.mobile.sobjects.details',{ sObject: sObject });
    }
    $scope.manageSObjectFields = function(sObject){
        $state.go('admin.mobile.sobjects.managesobjectfields',{ sObject: sObject });
    }
      
    $scope.manage = function(){
        $state.go('admin.mobile.sobjects.manage');
    }
    
    $scope.initBlockUiBlocks = function(){
        $scope.blockUI = {
            loadSObjects: blockUI.instances.get('loadSObjects')
        };
    };
    $scope.init = function(){
        console.log('AdminMobileSObjectsListController loaded!');
        $scope.initBlockUiBlocks();
        $scope.loadSObjects();
    };
    $scope.init();
}]);

admin.controller('AdminMobileSObjectsManageController',[
            '$scope','$state','$timeout','$q','mobileSobjectService','sfdcService','blockUI','$dialog','$filter',
    function($scope , $state , $timeout , $q , mobileSobjectService , sfdcService , blockUI , $dialog,$filter){
        
    $scope.describeSObjects = function(){
        if(!$scope.blockUI.describeSObjects.state().blocking){
            $scope.blockUI.describeSObjects.start('Loading salesforce sobjects...');
            sfdcService.describeSObjects({})
                .success(function(response){
                    if(response.success){
                        $scope.sfdcSObjects = response.data.sobjects;
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                    $scope.blockUI.describeSObjects.stop();
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading salesforce sobjects.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.describeSObjects.stop();
                });
        }
    }
    $scope.lookupSObjects = function(sObject){
        var lookupSObjectsNames = [];
        if($scope.sfdcSObjects !== undefined && $scope.sfdcSObjects !== null && $scope.sfdcSObjects.length > 0 && $scope.sObjects.length > 0){
            angular.forEach(sObject.SObjectFields, function(field){
                if(field.type === 'reference' && field.custom === true && lookupSObjectsNames.indexOf(field.referenceTo[0]) === -1 && $scope.sObjectsNames.indexOf(field.referenceTo[0]) === -1){
                    lookupSObjectsNames.push(field.referenceTo[0]);
                }
            });
        }
        return lookupSObjectsNames;
    };
    $scope.loadSObjects = function(){
        if(!$scope.blockUI.loadSObjects.state().blocking){
            $scope.blockUI.loadSObjects.start('Loading mobile sobjects...');
            $scope.blockUI.describeSObjects.start('Loading local sobjects...');
            mobileSobjectService.loadSObjects({
                    includeFields: true
                })
                .success(function(response){
                    if(response.success){
                        $scope.sObjects =  $filter('filter')(response.data.sObjects, {forMobile:true});
                        $scope.sfdcSObjects= $filter('filter')(response.data.sObjects, {forMobile:false});;
                        $scope.sObjectsNames = [];
                        angular.forEach($scope.sObjects, function(sObj){
                            $scope.sObjectsNames.push(sObj.name);
                        });
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                    $scope.blockUI.loadSObjects.stop();
                    $scope.blockUI.describeSObjects.stop();
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading local sobjects.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.loadSObjects.stop();
                    $scope.blockUI.describeSObjects.stop();
                });
        }
    }
    $scope.syncRefSObjects = function(sObject){
        var refSObjectNames = $scope.lookupSObjects(sObject);
        var sObjectsToSync = [];
        $scope.blockUI.sObjectActions.start('Preparing ...');
        angular.forEach($scope.sfdcSObjects, function(sfdcSObj){
            if(refSObjectNames.indexOf(sfdcSObj.name) !== -1){
                sObjectsToSync.push(angular.copy(sfdcSObj));
            }
        });
        $scope.blockUI.sObjectActions.stop();
        
        $scope.currentSObjectIndex = 0;
        var stopSync = $scope.$watch(function(){
            return $scope.currentSObjectIndex;
        },function(newValue,oldValue){
            if(newValue === 0 || newValue === (oldValue + 1)){
                if(newValue === sObjectsToSync.length){
                    stopSync();
                    $scope.loadSObjects();
                }else{
                    $scope.newSObject(sObjectsToSync[newValue], function(){
                        $scope.currentSObjectIndex++;
                    });
                }
            }
        });
        document.getElementById("chkLocalObjSelectAll").checked = false;
        document.getElementById("chkMobileObjSelectAll").checked = false;
    };
    $scope.syncOne = function(sObject,callback){
        $timeout(function(){
            callback();
        },1000);
    };
    $scope.callObjSelectAll = function (sAllChkId, chkName) {
        var sAll = document.getElementById(sAllChkId);
        var chks = document.getElementsByName(chkName);
        if (sAll.checked) {
            for (var i = 0; i < chks.length; i++) {
                chks[i].checked = true;
            }
        }
        else {
            for (var i = 0; i < chks.length; i++) {
                chks[i].checked = false;
            }
        }
    }
    $scope.newSObjects = function (callback) {
        var chks = document.getElementsByName("chkLocalsObj");
        var jsonStr = '';
        var obj;
        var isSelected = false;
        for (var i = 0; i < chks.length; i++) {
            if (chks[i].checked) {
                isSelected = true;
                obj = JSON.parse('{"thesObjects":[' + chks[i].id + ']}');
                jsonStr = JSON.stringify(obj);
                obj = JSON.parse(jsonStr).thesObjects[0];
                jsonStr = JSON.stringify(obj);
                $scope.newSObject(jsonStr);
            }
        }
        if (!isSelected) {
            $dialog.alert("Please select Local sObjects tobe added");
        }
        document.getElementById("chkLocalObjSelectAll").checked = false;
        document.getElementById("chkMobileObjSelectAll").checked = false;
    }
    $scope.newSObject = function (sObjectArr, callback) {
        var sObject = sObjectArr;
        if (angular.isString(sObjectArr)) {
            sObject = JSON.parse(sObjectArr);
        }

        $scope.blockUI.sObjectActions.start('Synchronizing '+ sObject.label +'...');
        // $scope.blockUI.sObjectActions.start('Saving new SObject...');

        var duplicate = false;
        angular.forEach($scope.sObjects,function(sObj){
            if(!duplicate && sObj.name === sObject.name){
                duplicate = true;
            }
        });
        if(duplicate){
            $dialog.alert('Duplicate entry found for '+ sObject.label, 'Duplicate', 'pficon pficon-warning-triangle-o');
            $scope.blockUI.sObjectActions.stop();
            return;
        }
        sObject.forMobile=true;
        mobileSobjectService.updateSObject(sObject)
            .success(function(response){
                if(response.success){
                    if(!callback){
                        $scope.loadSObjects();
                    }
                }else{
                    $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                }
                $scope.blockUI.sObjectActions.stop();
                if(callback){
                    callback();
                }
            })
            .error(function(response){
                $dialog.alert('Error occured while saving new sObject.','Error','pficon pficon-error-circle-o');
                $scope.blockUI.sObjectActions.stop();
                if(callback){
                    callback(true);
                }
            });
    }
    $scope.deleteSObjects = function () {
        var chks = document.getElementsByName("chkMobilesObj");
        var jsonStr = '';
        var obj;
        var isSelected = false;
        for (var i = 0; i < chks.length; i++) {
            if (chks[i].checked) {
                isSelected = true;
                break;
            }
        }
        if (!isSelected) {
            $dialog.alert("Please select Mobile sObjects tobe deleted");
            return;
        }

        if (isSelected) {
            $dialog.confirm({
                title: 'Confirm delete ?',
                yes: 'Yes, Delete', no: 'Cancel',
                message: 'All information related to selected sObects will be deleted. \nAre you sure ?',
                class: 'danger'
            }, function (confirm) {
                if (confirm) {
                    for (var i = 0; i < chks.length; i++) {
                        if (chks[i].checked) {
                            obj = JSON.parse('{"thesObjects":[' + chks[i].id + ']}');
                            jsonStr = JSON.stringify(obj);
                            obj = JSON.parse(jsonStr).thesObjects[0];
                            jsonStr = JSON.stringify(obj);
                            $scope.deleteSObject(jsonStr);
                        }
                    }
                    document.getElementById("chkLocalObjSelectAll").checked = false;
                    document.getElementById("chkMobileObjSelectAll").checked = false;
                }
            });
        }
    }
    $scope.deleteSObject = function (sObjectArr) {
        var sObject = sObjectArr;
        if (angular.isString(sObjectArr)) {
            sObject = JSON.parse(sObjectArr);
        }

        $scope.blockUI.sObjectActions.start('Deleting ' + sObject.label + '...');
        sObject.forMobile = false;
        mobileSobjectService.updateSObject(sObject)
            .success(function(response){
                $scope.blockUI.sObjectActions.stop();
                if(response.success){
                    $scope.loadSObjects();
                }else{
                    $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                }
            })
            .error(function (response) {
                $scope.blockUI.sObjectActions.stop();
                $dialog.alert('Error occured while deleting sObject.','Error','pficon pficon-error-circle-o');
            });
    }

    $scope.refreshResults = function(){
        if(!$scope.blockUI.sObjectActions.state().blocking){
            // $scope.describeSObjects();
            $scope.loadSObjects();
            
        }
    };
    $scope.returnToList = function(){
        $state.go('admin.mobile.sobjects.list');  
    };
    $scope.initBlockUiBlocks = function(){
        $scope.blockUI = {
            sObjectActions: blockUI.instances.get('sObjectActions'),
            describeSObjects: blockUI.instances.get('describeSObjects'),
            loadSObjects: blockUI.instances.get('loadSObjects')
        };
    };
    $scope.init = function(){
        $scope.initBlockUiBlocks();
        console.log('AdminMobileSObjectsManageController loaded!');
        $scope.refreshResults();
    };  
    $scope.init();
}]);

admin.controller('AdminMobileSObjectsDetailsController',[
            '$scope','$state','$stateParams','mobileSobjectService','sfdcService','blockUI','$dialog','$timeout',
    function($scope , $state , $stateParams , mobileSobjectService , sfdcService , blockUI , $dialog , $timeout){
        $scope.sObject = ($stateParams.sObject) ? $stateParams.sObject : null;
        
        $scope.loadSObjectFields = function(){
            if(!$scope.blockUI.sObjectFields.state().blocking && $scope.sObject != null){
                $scope.blockUI.sObjectFields.start('Loading '+ $scope.sObject.label +' fields...');
                mobileSobjectService.loadSObjectFields($scope.sObject)
                    .success(function(response){
                        if(response.success){
                            $scope.sObjectFields = response.data.sObjectFields;
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.sObjectFields.stop();
                    })
                    .error(function(response){
                        $dialog.alert('Error occured while loading sobject fields.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.sObjectFields.stop();
                    });
            }
        };
        $scope.returnToList = function(){
            $state.go('admin.mobile.sobjects.list');  
        };
        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                sObjectFields: blockUI.instances.get('sObjectFields')
            };
        };
        $scope.init = function(){
            $scope.initBlockUiBlocks();
            console.log('AdminMobileSObjectsDetailsController loaded!');
            $scope.loadSObjectFields();
        };  
        $scope.init();
    }
]);

admin.controller('AdminMobileSObjectsFieldsManageController',[
            '$scope','$state','$stateParams','$timeout','$q','mobileSobjectService','sfdcService','blockUI','$dialog','$filter',
    function($scope , $state ,$stateParams, $timeout , $q , mobileSobjectService , sfdcService , blockUI , $dialog,$filter){
    $scope.sObject = ($stateParams.sObject) ? $stateParams.sObject : null;        
    
    $scope.dependentSObjectsFields = function(sObjectFields){
        var dependentSObjectFieldsNames = [];
        if($scope.sfdcSObjectFields !== undefined && $scope.sfdcSObjectFields !== null && $scope.sfdcSObjectFields.length > 0 && $scope.sObjectFields.length > 0){
            if(sObjectFields.type === 'picklist' && sObjectFields.controllerName && sObjectFields.controllerName!="" && sObjectFields.custom === true && dependentSObjectFieldsNames.indexOf(sObjectFields.controllerName) === -1 && $scope.sObjectsFieldsNames.indexOf(sObjectFields.controllerName) === -1){
                dependentSObjectFieldsNames.push(sObjectFields.controllerName);
            }
        }
        return dependentSObjectFieldsNames;
    };
    $scope.loadSObjectFields = function(){
        if(!$scope.blockUI.loadSObjectsFields.state().blocking){
            $scope.blockUI.loadSObjectsFields.start('Loading local sobjects fields...');
            $scope.blockUI.describeSObjectsFields.start('Loading salesforce sobjects fields...');
            mobileSobjectService.loadSObjectFields($scope.sObject)
                .success(function(response){
                    if(response.success){
                        $scope.sObjectFields =  $filter('filter')(response.data.sObjectFields, {forMobile:true});
                        $scope.sfdcSObjectFields= $filter('filter')(response.data.sObjectFields, {forMobile:false});
                        $scope.sObjectsFieldsNames = [];
                        angular.forEach($scope.sObjectFields, function(sObjField){
                            $scope.sObjectsFieldsNames.push(sObjField.name);
                        });
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                    $scope.blockUI.loadSObjectsFields.stop();
                    $scope.blockUI.describeSObjectsFields.stop();
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading local sobjects.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.loadSObjectsFields.stop();
                    $scope.blockUI.describeSObjectsFields.stop();
                });
        }
    }
    $scope.syncRefSObjectsFields = function(sObjectFields){
        var dependentSObjectfieldsNames = $scope.dependentSObjectsFields(sObjectFields);
        var sObjectsToSync = [];
        $scope.blockUI.sObjectActions.start('Preparing ...');
        angular.forEach($scope.sfdcSObjectFields, function(sfdcSObjFields){
            if(dependentSObjectfieldsNames.indexOf(sfdcSObjFields.name) !== -1){
                sObjectsToSync.push(angular.copy(sfdcSObjFields));
            }
        });
        $scope.blockUI.sObjectActions.stop();
        
        $scope.currentSObjectIndex = 0;
        var stopSync = $scope.$watch(function(){
            return $scope.currentSObjectIndex;
        },function(newValue,oldValue){
            if(newValue === 0 || newValue === (oldValue + 1)){
                if(newValue === sObjectsToSync.length){
                    stopSync();
                    $scope.loadSObjectFields();
                }else{
                    $scope.newSObjectField(sObjectsToSync[newValue], function(){
                        $scope.currentSObjectIndex++;
                    });
                }
            }
        });
        document.getElementById("chkLocalObjFieldSelectAll").checked = false;
        document.getElementById("chkMobileObjFieldSelectAll").checked = false;
    };
    $scope.syncOne = function(sObject,callback){
        $timeout(function(){
            callback();
        },1000);
    };
    $scope.callObjFieldSelectAll = function (sAllChkId, chkName) {
        var sAll = document.getElementById(sAllChkId);
        var chks = document.getElementsByName(chkName);
        if (sAll.checked) {
            for (var i = 0; i < chks.length; i++) {
                chks[i].checked = true;
            }
        }
        else {
            for (var i = 0; i < chks.length; i++) {
                chks[i].checked = false;
            }
        }
    }
    $scope.newSObjectFields = function (callback) {
        var chks = document.getElementsByName("chkLocalsObjField");
        var jsonStr = '';
        var obj;
        var isSelected = false;
        for (var i = 0; i < chks.length; i++) {
            if (chks[i].checked) {
                isSelected = true;
                obj = JSON.parse('{"thesObjFields":[' + chks[i].id + ']}');
                jsonStr = JSON.stringify(obj);
                obj = JSON.parse(jsonStr).thesObjFields[0];
                jsonStr = JSON.stringify(obj);
                $scope.newSObjectField(jsonStr);
            }
        }
        if (!isSelected) {
            $dialog.alert("Please select Local sObject fields tobe added");
        }
        document.getElementById("chkLocalObjFieldSelectAll").checked = false;
        document.getElementById("chkMobileObjFieldSelectAll").checked = false;
    }
    $scope.newSObjectField = function(sObjectFieldsArr, callback){
        var sObjectFields = sObjectFieldsArr;
        if (angular.isString(sObjectFieldsArr)) {
            sObjectFields = JSON.parse(sObjectFieldsArr);
        }
        $scope.blockUI.sObjectActions.start('Synchronizing '+ sObjectFields.label +'...');
        // $scope.blockUI.sObjectActions.start('Saving new SObject...');
        
        var duplicate = false;
        angular.forEach($scope.sObjectFields,function(sObjField){
            if(!duplicate && sObjField.name === sObjectFields.name){
                duplicate = true;
            }
        });
        if(duplicate){
            $dialog.alert('Duplicate entry found for '+ sObjectFields.label, 'Duplicate', 'pficon pficon-warning-triangle-o');
            $scope.blockUI.sObjectActions.stop();
            return;
        }
        sObjectFields.forMobile=true;
        mobileSobjectService.updateSObjectFields(sObjectFields)
            .success(function(response){
                if(response.success){
                    if(!callback){
                        $scope.loadSObjectFields();
                    }
                }else{
                    $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                }
                $scope.blockUI.sObjectActions.stop();
                if(callback){
                    callback();
                }
            })
            .error(function(response){
                $dialog.alert('Error occured while saving new sObject fields.','Error','pficon pficon-error-circle-o');
                $scope.blockUI.sObjectActions.stop();
                if(callback){
                    callback(true);
                }
            });
    }
    $scope.deleteSObjects = function () {
        var chks = document.getElementsByName("chkMobilesObjField");
        var jsonStr = '';
        var obj;
        var isSelected = false;
        for (var i = 0; i < chks.length; i++) {
            if (chks[i].checked) {
                isSelected = true;
                break;
            }
        }
        if (!isSelected) {
            $dialog.alert("Please select Mobile sObjects fields tobe deleted");
            return;
        }

        if (isSelected) {
            $dialog.confirm({
                title: 'Confirm delete ?',
                yes: 'Yes, Delete', no: 'Cancel',
                message: 'All information related to  selected sObect fields will be deleted. \nAre you sure ?',
                class:'danger'
            },function(confirm){
                if(confirm){
                    for (var i = 0; i < chks.length; i++) {
                        if (chks[i].checked) {
                            obj = JSON.parse('{"thesObjFields":[' + chks[i].id + ']}');
                            jsonStr = JSON.stringify(obj);
                            obj = JSON.parse(jsonStr).thesObjFields[0];
                            jsonStr = JSON.stringify(obj);
                            $scope.deleteSObject(jsonStr);
                        }
                    }
                    document.getElementById("chkLocalObjFieldSelectAll").checked = false;
                    document.getElementById("chkMobileObjFieldSelectAll").checked = false;
                }
            });
        }
    }
    $scope.deleteSObject = function (sObjectFieldsArr) {
        var sObjectFields = sObjectFieldsArr;
        if (angular.isString(sObjectFieldsArr)) {
            sObjectFields = JSON.parse(sObjectFieldsArr);
        }

        $scope.blockUI.sObjectActions.start('Deleting '+ sObjectFields.label +'...');
        sObjectFields.forMobile=false;
        mobileSobjectService.updateSObjectFields(sObjectFields)
            .success(function(response){
                $scope.blockUI.sObjectActions.stop();
                if(response.success){
                    $scope.loadSObjectFields();
                }else{
                    $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                }
            })
            .error(function (response) {
                $scope.blockUI.sObjectActions.stop();
                $dialog.alert('Error occured while deleting sObject.','Error','pficon pficon-error-circle-o');
            });
    }
    
    $scope.refreshResults = function(){
        if(!$scope.blockUI.sObjectActions.state().blocking){
            // $scope.describeSObjects();
            $scope.loadSObjectFields();
            
        }
    };
    $scope.returnToList = function(){
        $state.go('admin.mobile.sobjects.list');  
    };
    $scope.initBlockUiBlocks = function(){
        $scope.blockUI = {
            sObjectActions: blockUI.instances.get('sObjectActions'),
            describeSObjectsFields: blockUI.instances.get('describeSObjects'),
            loadSObjectsFields: blockUI.instances.get('loadSObjects')
        };
    };
    $scope.init = function(){
        $scope.initBlockUiBlocks();
        console.log('AdminMobileSObjectsFieldsManageController loaded!');
        $scope.refreshResults();
    };  
    $scope.init();
}]);
admin.controller('AdminMobileConfigController',[
            '$scope','$state','mobileSobjectService','blockUI','$dialog','$filter',
    function($scope , $state , mobileSobjectService , blockUI , $dialog,$filter){
    $scope.syncWithMiddleware = function(){
        $scope.blockUI.MobileConfigBlockUI.start('Synchronizing with middleware...');
        mobileSobjectService.syncWithMiddleware()
            .success(function(response){
                $scope.blockUI.MobileConfigBlockUI.stop();
                if(response.success){
                    $dialog.alert(response.message,'Success','');
                }else{
                    $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                }
            })
            .error(function(response){
                $scope.blockUI.MobileConfigBlockUI.stop();
                $dialog.alert('Error occured while deleting sObject.','Error','pficon pficon-error-circle-o');
            });
    };
    $scope.initBlockUiBlocks = function(){
        $scope.blockUI = {
            MobileConfigBlockUI : blockUI.instances.get('MobileConfigBlockUI')
        }
    }
    $scope.init = function(){
        console.log('AdminMobileSObjectsListController loaded!');
        $scope.initBlockUiBlocks();
        $scope.MobileConfig={};
        mobileSobjectService.loadMobileConfig()
            .success(function(response){
                if(response.success){
                    $scope.MobileConfig.config=response.config;
                }else{
                    $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                }
            })
            .error(function (response) {
                $scope.blockUI.sObjectActions.stop();
                $dialog.alert('Error occured while deleting sObject.','Error','pficon pficon-error-circle-o');
            });
    };
    $scope.init();
}]);