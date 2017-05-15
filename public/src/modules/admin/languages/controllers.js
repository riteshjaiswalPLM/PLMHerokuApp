'use strict';

admin.controller('AdminLanguagesListController',[
            '$scope','$state','languageService','blockUI','$dialog','$timeout','$adminLookups',
    function($scope , $state , languageService , blockUI , $dialog , $timeout, $adminLookups){
        $scope.openLanguagesLookup = function(){
            var data = {
                criteria: {
                    where: {
                        created: false
                    }
                }
            };
            $adminLookups.language(data,function(language){
                $scope.language = language;

                if(!$scope.blockUI.loadLanguages.state().blocking){
                    $scope.blockUI.loadLanguages.start('Creating Language...');
                    languageService.saveLanguage($scope.language)
                        .success(function(response){
                            $scope.blockUI.loadLanguages.stop();
                            if(response.success){
                                $scope.loadLanguages();
                            }else{
                                $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                            }
                        })
                        .error(function(response) {
                            $dialog.alert('Error occured while creating language.','Error','pficon pficon-error-circle-o');
                            $scope.blockUI.loadLanguages.stop();
                        });
                }
            });
        };
        $scope.loadLanguages = function(){
            if(!$scope.blockUI.loadLanguages.state().blocking){
                $scope.blockUI.loadLanguages.start('Loading languages...');
                languageService.loadLanguages({
                    criteria: {
                        where: {
                            created: true
                        }
                    }
                })
                .success(function(response){
                    if(response.success){
                        $scope.languages = response.data.languages;
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                    $scope.blockUI.loadLanguages.stop();
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading languages.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.loadLanguages.stop();
                });
            }
        };
        $scope.deleteLanguage = function(language){
            $dialog.confirm({
                title: 'Confirm delete ?',
                yes: 'Yes, Delete', no: 'Cancel',
                message: 'Are you sure to delete language for "'+ language.name +'" ?',
                class:'danger'
            },function(confirm){
                if(confirm){
                    $scope.blockUI.loadLanguages.start('Deleting "'+language.name +'" language...');
                    languageService.deleteLanguage(language)
                        .success(function(response){
                            $scope.blockUI.loadLanguages.stop();
                            if(response.success){
                                $scope.loadLanguages();
                            }else{
                                $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                            }
                        })
                        .error(function (response) {
                            $scope.blockUI.loadLanguages.stop();
                            $dialog.alert('Error occured while deleting language.','Error','pficon pficon-error-circle-o');
                        });
                }
            });
        };
        $scope.changeActive = function(language){
            var message = (language.active) ? 'Activating' : 'Deactivating';
            $scope.blockUI.loadLanguages.start(message +' "'+ language.name);
            languageService.changeActive(language)
                .success(function(response){
                    if(!response.success){
                        language.active = !language.active;
                    }
                    $scope.blockUI.loadLanguages.stop();
                })
                .error(function (response) {
                    $scope.blockUI.loadLanguages.stop();
                    $dialog.alert('Error occured while '+ message.toLowerCase() +' language.','Error','pficon pficon-error-circle-o');
                });
        };
        $scope.markAsDefault = function(language){
            if(!$scope.blockUI.loadLanguages.state().blocking){
                $scope.blockUI.loadLanguages.start('Marking '+ language.name + ' language as default...');
                languageService.markAsDefault(language)
                .success(function(response){
                    $scope.blockUI.loadLanguages.stop();
                    if(response.success){
                        $scope.loadLanguages();
                    }else{
                        $dialog.alert('Error occured while marking default language.','Error','pficon pficon-error-circle-o');
                    }
                })
                .error(function(response){
                    $dialog.alert('Error occured while marking default language.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.loadLanguages.stop();
                });
            }
        };
        $scope.edit = function(language){
            $state.go('admin.languages.edit',{language: language});
            $state.go('admin.languages.edit',{language: language});
        };
        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                loadLanguages: blockUI.instances.get('loadLanguages')
            };
        };
        $scope.init = function(){
            console.log('AdminLanguagesListController loaded!');
            $scope.initBlockUiBlocks();
            $scope.loadLanguages();
        };
        $scope.init();
    }    
]);

admin.controller('AdminLanguagesEditController',[
            '$scope','$state','$stateParams','$controller','languageService','blockUI','$dialog','$timeout','$adminLookups',
    function($scope , $state , $stateParams , $controller , languageService , blockUI , $dialog , $timeout , $adminLookups ){
        $scope.csvToJSON = function(csv){
            var lines=csv.replace(/\"/g, "").replace(/\r/g,"").split("\n");
            var result = [];
            var headers=lines[0].split(",");
            for(var i=1;i<lines.length-1;i++){
                var obj = {};
                var currentline=lines[i].split(",");
                for(var j=0;j<headers.length;j++){
                    if(currentline[j] !== ""){
                        obj[headers[j]] = currentline[j];        
                    }
                }
                result.push(obj);
            }
            return result;
        };
        $scope.openSObjectsLookup = function(){
            $adminLookups.sObject({},function(sObject){
                $scope.language.SObject = sObject;
            });
        };
        $scope.viewLanguageDetails = function(){
            var viewLanguageDetail = blockUI.instances.get('saveLanguage');
            if(!$scope.language || $scope.language.aspect == undefined){
                return;
            }
            else{
                if($scope.language.aspect !== 'Fixed Label' && (!$scope.language.SObject || !$scope.language.SObject.id)){
                    return;
                }
                viewLanguageDetail.start('Loading '+ $scope.language.aspect + ($scope.language.aspect !== 'Fixed Label' ? (' for ' + $scope.language.SObject.label) : '') + '...');
                languageService.viewLanguageDetails($scope.language)
                    .success(function(response){
                        viewLanguageDetail.stop();
                        if(response.success){
                            $scope.language.translations = [];
                            $scope.language.translations = response.data.translations
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                    })
                    .error(function(response){
                        viewLanguageDetail.stop();
                        $dialog.alert('Error occured while Loading '+ $scope.language.aspect + ($scope.language.aspect !== 'Fixed Label' ? (' for ' + $scope.language.SObject.label) : '') + '.','Error','pficon pficon-error-circle-o');
                    });
            }
        };
        $scope.automateLanguageTranslation = function(){
            var automateLanguageTranslation = blockUI.instances.get('saveLanguage');
            if(!$scope.language || $scope.language.aspect == undefined){
                return;
            }
            else{
                if($scope.language.aspect !== 'Fixed Label' && (!$scope.language.SObject || !$scope.language.SObject.id)){
                    return;
                }
                automateLanguageTranslation.start('Auto translating '+ $scope.language.aspect + ($scope.language.aspect !== 'Fixed Label' ? ('s for ' + $scope.language.SObject.label) : '') + '...');
                languageService.automateLanguageTranslation($scope.language)
                    .success(function(response){
                        automateLanguageTranslation.stop();
                        $dialog.alert(response.message,'','',function(){
                            if(response.success){
                                $scope.viewLanguageDetails();
                            }
                        });
                    })
                    .error(function(response){
                        automateLanguageTranslation.stop();
                        $dialog.alert('Error occured while importing '+ $scope.language.aspect + ($scope.language.aspect !== 'Fixed Label' ? (' for ' + $scope.language.SObject.label) : '') + '.','Error','pficon pficon-error-circle-o');
                    });
            }
        };
        $scope.importLanguageTranslation = function () {
            var importLanguageTranslation = blockUI.instances.get('saveLanguage');
            var file = $scope.language.translationMappingFile;
            $scope.language.translationMappingFile = {};
            
            if(!$scope.language || (!$scope.language.SObject || !$scope.language.SObject.id)){
                $scope.language.translationMappingFile = undefined;
                return;
            }
            else{
                if($scope.language.aspect !== 'Fixed Label' && $scope.language.SObject.id === undefined){
                    return;
                }
                importLanguageTranslation.start('Importing '+ $scope.language.aspect + ($scope.language.aspect !== 'Fixed Label' ? (' for ' + $scope.language.SObject.label) : '') + '...');
                $scope.language.translationMappingFile = $scope.csvToJSON(file);
                languageService.importLanguageTranslation($scope.language)
                    .success(function(response){
                        importLanguageTranslation.stop();
                        $scope.language.translationMappingFile = undefined;
                        $dialog.alert(response.message,'','',function(){
                            if(response.success){
                                $scope.viewLanguageDetails();
                            }
                        });
                    })
                    .error(function(response){
                        importLanguageTranslation.stop();
                        $dialog.alert('Error occured while importing '+ $scope.language.aspect + ($scope.language.aspect !== 'Fixed Label' ? (' for ' + $scope.language.SObject.label) : '') + '.','Error','pficon pficon-error-circle-o');
                    });
            }  
        };
        $scope.exportLanguageTranslation = function(){
            var exportLanguageTranslation = blockUI.instances.get('saveLanguage');
            if(!$scope.language || $scope.language.aspect == undefined){
                return;
            }
            else{
                if($scope.language.aspect !== 'Fixed Label' && (!$scope.language.SObject || !$scope.language.SObject.id)){
                    return;
                }
                exportLanguageTranslation.start('Exporting '+ $scope.language.aspect + ($scope.language.aspect !== 'Fixed Label' ? (' for ' + $scope.language.SObject.label) : '') + '...');
                languageService.exportLanguageTranslation($scope.language)
                    .success(function(response, status, headers, config){
                        exportLanguageTranslation.stop();
                        if(response.hasOwnProperty('success') && !response.success){
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                            return
                        }
                        var blob = new Blob([response], {type: "application/text/csv; charset=utf-8"});
                        var a = document.createElement("a");
                        document.body.appendChild(a);
                        a.href = URL.createObjectURL(blob);
                        a.download = $scope.language.aspect.replace(" ", "_") + ($scope.language.aspect !== 'Fixed Label' ? ('_' + $scope.language.SObject.label.replace(" ", "_")) : '') +".csv";
                        a.click();
                    })
                    .error(function(response){
                        exportLanguageTranslation.stop();
                        $dialog.alert('Error occured while exporting '+ $scope.language.aspect + ($scope.language.aspect !== 'Fixed Label' ? (' for ' + $scope.language.SObject.label) : '') + '.','Error','pficon pficon-error-circle-o');
                    });
            }
        };
        $scope.cancel = function(){
            $state.go('admin.languages.list');  
        };
        
        $scope.init = function(){
            console.log('AdminLanguagesEditController loaded!');
            $scope.language = ($stateParams.language) ? $stateParams.language : {
                name:null,
                code: null,
                active: false,
            };
        };
        $scope.init();
    }  
]);