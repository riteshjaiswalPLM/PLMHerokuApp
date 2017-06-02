'use strict';

admin.controller('AdminLayoutsListController',[
            '$scope','$state','layoutService','blockUI','$dialog','$timeout','$adminLookups',
    function($scope , $state , layoutService , blockUI , $dialog , $timeout , $adminLookups){
        
        $scope.openSObjectLayoutsLookup = function(){
            var data = {
                criteria: {
                    where: {
                        created: false,
                        type : {
                            $ne: 'Mobile'
                        }
                    }
                }
            };
            $adminLookups.sObjectLayout(data,function(sObjectLayout){
                $scope.sObjectLayout = sObjectLayout;
                
                if(!$scope.blockUI.loadLayouts.state().blocking){
                    $scope.blockUI.loadLayouts.start('Creating '+ sObjectLayout.type +' layout for '+ sObjectLayout.SObject.label +'...');
                    layoutService.createLayout(sObjectLayout)
                    .success(function(response){
                        $scope.blockUI.loadLayouts.stop();
                        if(response.success){
                            $scope.loadLayouts();
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                    })
                    .error(function(response) {
                        $dialog.alert('Error occured while creating layout.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.loadLayouts.stop();
                    });
                }
            });
        };
        
        $scope.loadLayouts = function(){
            if(!$scope.blockUI.loadLayouts.state().blocking){
                $scope.blockUI.loadLayouts.start('Loading layouts...');
                layoutService.loadLayouts({
                    criteria: {
                        where: {
                            created: true,
                            type : {
                                $ne: 'Mobile'
                            }
                        }
                    }
                })
                .success(function(response){
                    if(response.success){
                        $scope.layouts = response.data.layouts;
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                    $scope.blockUI.loadLayouts.stop();
                })
                .error(function(response){
                    $dialog.alert('Error occured while loading layouts.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.loadLayouts.stop();
                });
            }
        };
        $scope.markAsDefault = function(layout){
           
            if(!(layout.type === 'Details' || layout.type === 'Edit') && !$scope.blockUI.loadLayouts.state().blocking){
                layout.default=!layout.default;
                $scope.blockUI.loadLayouts.start('Marking '+ layout.SObject.label + ' ' + layout.type +' layout as default...');
                layoutService.markAsDefault(layout)
                .success(function(response){
                    $scope.blockUI.loadLayouts.stop();
                    if(response.success){
                        $scope.loadLayouts();
                    }else{
                        $dialog.alert('Error occured while marking default layout.','Error','pficon pficon-error-circle-o');
                    }
                })
                .error(function(response){
                    $dialog.alert('Error occured while marking default layout.','Error','pficon pficon-error-circle-o');
                    $scope.blockUI.loadLayouts.stop();
                });
            }
        };
        $scope.deleteLayout = function(layout){
            $dialog.confirm({
                title: 'Confirm delete ?',
                yes: 'Yes, Delete', no: 'Cancel',
                message: 'Are you sure to delete '+ layout.type +' layout of '+ layout.SObject.label +' ?',
                class:'danger'
            },function(confirm){
                if(confirm){
                    // DELETE LAYOUT
                    $scope.blockUI.loadLayouts.start('Deleting "'+layout.SObject.label + ' ' + layout.type +'" layout...');
                    layoutService.deleteLayout(layout)
                        .success(function(response){
                            $scope.blockUI.loadLayouts.stop();
                            if(response.success){
                                $scope.loadLayouts();
                            }else{
                                $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                            }
                        })
                        .error(function (response) {
                            $scope.blockUI.loadLayouts.stop();
                            $dialog.alert('Error occured while deleting layout.','Error','pficon pficon-error-circle-o');
                        });
                }
            });
        };
        $scope.changeActive = function(layout){
            // $dialog.alert('changing from ' + !layout.active + ' to ' + layout.active + '.');
            var message = (layout.active) ? 'Activating' : 'Deactivating';
            $scope.blockUI.loadLayouts.start(message +' "'+layout.SObject.label + ' ' + layout.type +'" layout...');
            layoutService.changeActive(layout)
                .success(function(response){
                    if(!response.success){
                        layout.active = !layout.active;
                    }
                    $scope.blockUI.loadLayouts.stop();
                })
                .error(function (response) {
                    $scope.blockUI.loadLayouts.stop();
                    $dialog.alert('Error occured while '+ message.toLowerCase() +' layout.','Error','pficon pficon-error-circle-o');
                });
        };
        
        $scope.edit = function(layout){
            $state.go('admin.layouts.edit',{layout: layout});
        };
        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                loadLayouts: blockUI.instances.get('loadLayouts')
            };
        };
        $scope.init = function(){
            console.log('AdminLayoutsListController loaded!');
            $scope.initBlockUiBlocks();
            $scope.loadLayouts();
        };
        $scope.init();
    }
]);

admin.controller('AdminLayoutsEditController',[
            '$scope','$state','$stateParams','$controller','layoutService','sobjectService','blockUI','$dialog','$timeout','$adminLookups','genericComponentService','staticComponentService',
    function($scope , $state , $stateParams , $controller , layoutService , sobjectService , blockUI , $dialog , $timeout , $adminLookups , genericComponentService , staticComponentService){
        var thisCtrl = this;
        $scope.loadSObjectFields = function(){
            if(!$scope.blockUI.sObjectFields.state().blocking && $scope.layout.SObject != null){
                $scope.blockUI.sObjectFields.start('Loading ...');
                sobjectService.loadSObjectFields($scope.layout.SObject)
                    .success(function(response){
                        if(response.success){
                            $scope.layout.SObject.fields = []; // = response.data.sObjectFields;
                            $scope.refSObjects = response.data.refSObjects;
                            angular.forEach(response.data.sObjectFields,function(field){
                                var ControllerSObjectField = undefined;
                                if(field.controllerName && (field.type === 'picklist' || field.type === 'multipicklist')){
                                    angular.forEach(response.data.sObjectFields, function(ctrlField){
                                        if(ctrlField.name === field.controllerName){
                                            ControllerSObjectField = ctrlField;
                                        }
                                    });
                                }
                                var SObjectLayoutField = {
                                    SObjectField: field,
                                    ControllerSObjectField: ControllerSObjectField,
                                    label: field.label,
                                    type: null,
                                    hidden: false,
                                    deleted: false,
                                    recordid: field.type === 'id',
                                    SObjectLayoutId: $scope.layout.id
                                };
                                $scope.layout.SObject.fields.push(SObjectLayoutField);
                            });
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
        $scope.loadChildSObjects = function(){
            if(($scope.layout.type === 'Edit' || $scope.layout.type === 'Details') && !$scope.blockUI.childSObjects.state().blocking && $scope.layout.SObject != null){
                $scope.blockUI.childSObjects.start('Loading ...');
                sobjectService.loadChildSObjects($scope.layout.SObject)
                    .success(function(response){
                        if(response.success){
                            $scope.layoutRelatedLists = [];
                            angular.forEach(response.data.sObjectFields,function(sObjectField){
                                $scope.layoutRelatedLists.push({
                                    SObject: sObjectField.SObject,
                                    title: sObjectField.SObject.labelPlural,
                                    active: true,
                                    deleted: false,
                                    readonly: false
                                });
                            });
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.childSObjects.stop();
                    })
                    .error(function(response){
                        $dialog.alert('Error occured while loading sobject fields.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.childSObjects.stop();
                    });
            }
        };
        $scope.components = function () {
            if($scope.layout.type !== 'List' && $scope.componentsValues === undefined){
                $scope.componentsValues = [{
                            title: 'One Column Section',
                            deleted: false,
                            readonly: false,
                            active: true,
                            isComponent: false,
                            SObjectLayoutId: undefined,
                            columns: [
                                []
                            ]
                        }, {
                            title: 'Two Columns Section',
                            deleted: false,
                            readonly: false,
                            active: true,
                            isComponent: false,
                            SObjectLayoutId: undefined,
                            columns: [
                                [],[]
                            ]
                        }];
            }
            return $scope.componentsValues;
        };
        $scope.loadWidgets = function () {
            if($scope.layout.type !== 'List' && $scope.widgetsValues === undefined){
                $scope.widgetsValues = [];
                $scope.blockUI.widgets.start('Loading ...');
                genericComponentService.getComponentsForSObject($scope.layout.SObject)
                    .success(function(response){
                        if(response.success){
                            angular.forEach(response.data.components,function(component){
                                $scope.widgetsValues.push({
                                    title: component.title,
                                    deleted: false,
                                    readonly: false,
                                    active: true,
                                    isComponent: true,
                                    SObjectLayoutId: undefined,
                                    Component: component,
                                });
                            });
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.widgets.stop();
                    })
                    .error(function(response){
                        $dialog.alert('Error occured while loading sobject fields.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.widgets.stop();
                    });
                $scope.blockUI.widgets.start('Loading ...');
                staticComponentService.getComponentsForSObject($scope.layout.SObject)
                    .success(function(response){
                        if(response.success){
                            angular.forEach(response.data.components,function(component){
                                $scope.widgetsValues.push({
                                    title: component.title,
                                    deleted: false,
                                    readonly: false,
                                    active: true,
                                    isComponent: true,
                                    SObjectLayoutId: undefined,
                                    Component: component,
                                });
                            });
                        }else{
                            $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.widgets.stop();
                    })
                    .error(function(response){
                        $dialog.alert('Error occured while loading sobject fields.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.widgets.stop();
                    });
            }
            return $scope.widgetsValues;
        };
        $scope.returnToList = function(){
            $state.go('admin.layouts.list');  
        }; 
        $scope.removeFieldsStore=function(section,item){
            if(section.deletedFields==undefined){
                section.deletedFields=[];
            }
            section.deletedFields.push(item);
        } 
        $scope.removeAndReorder = function(items,item,index){
            var subRemoveAndReoprder = function(items,item,index){
                item.deleted = true;
                if(item.id === undefined || item.type == "Layout-Section-Field"){
                    items.splice(index,1);
                }
                
                var itemIndex = 0;
                angular.forEach(items,function(i, _index){
                    if(!i.deleted){
                        i.order = itemIndex;
                        itemIndex++;
                    }
                });
                
                if(item.columns!==undefined && angular.isArray(item.columns)){
                    angular.forEach(item.columns,function(fields){
                        angular.forEach(fields,function(field,fieldIndex){
                            field.deleted = true;
                        });
                    });
                }
            }
            if(item.fromfield || item.tofield){
                $dialog.confirm({
                    title: 'Want to remove field?',
                    yes: 'Yes', no: 'No',
                    message: 'Select item is ' + (item.fromfield ? 'from' : 'to') + ' field of range search.\nRemoval of this field will remove corresponding ' + (item.fromfield ? 'to' : 'from') + ' field of range search.',
                    class:'primary'
                },function(confirm){
                    if(confirm){
                        var toFromPair = [{item: item, index: index}];
                        angular.forEach(items,function(i, _index){
                            if(i.SObjectField.name === item.SObjectField.name){
                                toFromPair.push({item: i, index: _index});
                            }
                        });
                        subRemoveAndReoprder(items, toFromPair[0].item, toFromPair[0].index);
                        subRemoveAndReoprder(items, toFromPair[1].item, toFromPair[1].index);
                    }
                });
            }
            else{
                subRemoveAndReoprder(items,item,index);
            }
        };
        
        $scope.initBlockUiBlocks = function(){
            $scope.blockUI = {
                editLayout: blockUI.instances.get('editLayout'),
                sObjectFields: blockUI.instances.get('sObjectFields'),
                childSObjects: blockUI.instances.get('childSObjects'),
                widgets: blockUI.instances.get('widgets')
            };
        };
        $scope.init = function(){
            console.log('AdminLayoutsEditController loaded!');
            $scope.initBlockUiBlocks();
            $scope.layout = $stateParams.layout;
            $scope.loadSObjectFields();
            $scope.loadChildSObjects();
            $scope.loadWidgets();
            $timeout(function(){
                if($scope.layout.type === 'List'){
                    $scope.templateUrl = 'views/admin/layout/edit.list.html';
                    $scope.controller = 'AdminLayoutsEditListController';
                    angular.extend(thisCtrl, $controller($scope.controller,{ $scope: $scope}));
                }else{
                // }else if($scope.layout.type === 'Edit'){
                    $scope.templateUrl = 'views/admin/layout/edit.edit.html';
                    $scope.controller = 'AdminLayoutsEditEditController';
                    angular.extend(thisCtrl, $controller($scope.controller,{ $scope: $scope}));
                }
            },0);
        };
        $scope.init();
    }
]);

admin.controller('AdminLayoutsEditListController',[
            '$scope','$state','$stateParams','layoutService','sobjectService','blockUI','$dialog','$timeout','$adminLookups','$adminModals',
    function($scope , $state , $stateParams , layoutService , sobjectService , blockUI , $dialog , $timeout , $adminLookups,$adminModals ){
        $scope.searchCriteriaFieldsDropCallBack = function(event, index, item, external, type, allowedType){
            if($scope.isDuplicate($scope.searchCriteriaFields,item)){
                return false;
            }
            item.type = 'Search-Criteria-Field';
            var rangeAllowedDataTypes = ['date','datetime','double','int'];
            if(rangeAllowedDataTypes.indexOf(item.SObjectField.type) > -1){
                if(!angular.isDefined(item.tofield) && !angular.isDefined(item.fromfield)){
                    $dialog.confirm({
                        title: 'Allow to search range?',
                        yes: 'Yes', no: 'No',
                        message: 'Selected field is of type ' + item.SObjectField.type + '. Do you want this field to allow to search in range?\nIf you agree, it will generate to and from field for you.',
                        class:'primary'
                    },function(confirm){
                        if(confirm){
                            var itemTo = angular.copy(item);
                            if(!itemTo.toField){
                                itemTo.label = itemTo.label + ' to';
                                itemTo.tofield = true;
                                $scope.searchCriteriaFields.push(itemTo);
                            }
                            item.fromfield = true;
                            item.label = item.label + ' from';
                        }
                    });
                }
            }
            return item;
        };    
        $scope.searchResultFieldsDropCallBack = function(event, index, item, external, type, allowedType){
            if($scope.isDuplicate($scope.searchResultFields,item)){
                return false;
            }
            item.type = 'Search-Result-Field';
            return item;
        };
        $scope.isDuplicate = function(fields,item){
            var duplicate = false;
            angular.forEach(fields,function(field,index){
                if(!duplicate){
                    if(field.SObjectField.id === item.SObjectField.id && item.type === null && !field.deleted){
                        duplicate = true;
                    }
                }
            });
            return duplicate;
        };
        $scope.loadListLayoutFields = function(){
            if(!$scope.blockUI.editListLayout.state().blocking && $scope.layout.SObject != null){
                $scope.blockUI.editListLayout.start('Loading ...');
                layoutService.loadListLayoutFields($scope.layout)
                    .success(function(response){
                        if(response.success){
                            $scope.searchCriteriaFields = [];
                            $scope.searchResultFields = [];
                            angular.forEach(response.data.sObjectLayoutFields,function(field){
                                if(field.type === 'Search-Criteria-Field'){
                                    $scope.searchCriteriaFields.push(field);
                                }else{
                                    $scope.searchResultFields.push(field);
                                }
                            });
                        }else{
                            $dialog.alert('Error occured while loading layout fields.','Error','pficon pficon-error-circle-o');
                        }
                        $scope.blockUI.editListLayout.stop();
                    })
                    .error(function(response){
                        $dialog.alert('Server error occured while loading layout fields.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.editListLayout.stop();
                    });
            }
        };
        $scope.openActionButtonCriteriaModal = function(actionButton){
            $adminModals.criteriaModal({
                title: 'Action Button Criteria | ' + actionButton.title,
                fields: $scope.$parent.$parent.layout.SObject.fields,
                criteria: actionButton.criteria ? actionButton.criteria : null
            },function(criteria){
                actionButton.criteria = criteria;
            });
        };
        $scope.saveLayout = function(){
            if(!$scope.blockUI.editListLayout.state().blocking  && $scope.layout.SObject != null){
                $scope.blockUI.editListLayout.start('Saving ...');
                layoutService.saveListLayout($scope.searchCriteriaFields,$scope.searchResultFields,$scope.actionButtonCriteria,$scope.layout.id,$scope.layout.whereClause)
                    .success(function(response){
                        $scope.blockUI.editListLayout.stop();
                        if(response.success === true){
                            $scope.loadListLayoutFields();
                        }else{
                            $dialog.alert('Error occured while saving layout.','Error','pficon pficon-error-circle-o');
                        }
                    })
                    .error(function(response){
                        $scope.blockUI.editListLayout.stop();
                        $dialog.alert('Server error occured while saving layout.','Error','pficon pficon-error-circle-o');
                    });
            }
        };
        $scope.initListLayoutBlockUiBlocks = function(){
            $scope.blockUI.editListLayout = blockUI.instances.get('editListLayout');
        };
        $scope.loadActionButtonCriteria = function(){
            $scope.actionButtonCriteria=[];
            $scope.editActionButton={
                title : 'Edit',
                keyName : 'Edit'
            };
            $scope.actionButtonCriteria.push($scope.editActionButton);
            $scope.detailActionButton={
                title : 'Details',
                keyName : 'Details'
            };
            $scope.actionButtonCriteria.push($scope.detailActionButton);

            angular.forEach($scope.layout.btnCriteria,function(btnCriteria){
                if(btnCriteria.keyName==="Edit"){
                    $scope.editActionButton.criteria=btnCriteria.criteria;
                }
                else if(btnCriteria.keyName==="Details"){
                    $scope.detailActionButton.criteria=btnCriteria.criteria;
                }
            });
        };
        $scope.init = function(){
            console.log('AdminLayoutsEditListController loaded!');
            $scope.initListLayoutBlockUiBlocks();
            $scope.loadListLayoutFields();
            $scope.loadActionButtonCriteria();
        };
        $scope.init();
    }
]);

admin.controller('AdminLayoutsEditEditController',[
            '$scope','$state','$stateParams','layoutService','sobjectService','blockUI','$dialog','$timeout','$adminLookups','$adminModals',
    function($scope , $state , $stateParams , layoutService , sobjectService , blockUI , $dialog , $timeout , $adminLookups , $adminModals){
        $scope.openSectionPropertiesModal = function(section,index){
            $adminModals.layoutSectionProperties({
                layout: angular.copy($scope.layout),
                section: angular.copy(section)
            },function(newSection){
                $scope.layoutSections[index] = newSection;
            });
        };
        $scope.openSectionCriteriaModal = function(section,index){
            $adminModals.criteriaModal({
                title: 'Section Criteria | ' + section.title,
                fields: $scope.$parent.$parent.layout.SObject.fields,
                criteria: $scope.layoutSections[index].criteria ? $scope.layoutSections[index].criteria : null
            },function(criteria){
                $scope.layoutSections[index].criteria = criteria;
            });
        };
        $scope.openFieldCriteriaModal = function(field){
            $adminModals.criteriaModal({
                title: 'Field Criteria | ' + field.label,
                fields: $scope.$parent.$parent.layout.SObject.fields,
                criteria: field.criteria ? field.criteria : null
            },function(criteria){
                field.criteria = criteria;
            });
        };
        $scope.openRelatedListCriteriaModal = function(relatedList,index){
            $adminModals.criteriaModal({
                title: 'Related List Criteria | ' + relatedList.title,
                fields: $scope.$parent.$parent.layout.SObject.fields,
                criteria: relatedList.criteria ? relatedList.criteria : null
            },function(criteria){
                relatedList.criteria = criteria;
            });
        };
        $scope.openRelatedListPropertiesModal = function(relatedList,index){
            $adminModals.relatedListProperties({
                layout: angular.copy($scope.layout),
                relatedList: angular.copy(relatedList)
            },function(newRelatedList){
                $scope.relatedLists[index] = newRelatedList;
            });
        };
        $scope.openFieldPropertiesModal = function(section,sectionIndex,columnIndex,field,fieldIndex){
            $adminModals.layoutFieldProperties({
                layout: angular.copy($scope.layout),
                section: angular.copy(section),
                field: angular.copy(field),
                refSObjects: angular.copy($scope.refSObjects),
                fields: $scope.$parent.$parent.layout.SObject.fields
            },function(newField){
                $scope.layoutSections[sectionIndex].columns[columnIndex][fieldIndex] = newField;
            });
        };
        $scope.openFieldRequiredCriteriaModal = function(field,index){
        	$adminModals.multiObjectCriteriaModal({
                title: 'Field Required Criteria | ' + field.label,
                fields: fields,
                criteria: $scope.component.ComponentDetails[0].configuration.fields[index].requiredCriteria ? $scope.component.ComponentDetails[0].configuration.fields[index].requiredCriteria : null
            },function(criteria){
            	$scope.component.ComponentDetails[0].configuration.fields[index].requiredCriteria = criteria;
            });
        };
        $scope.sectionsDropCallBack = function(event, index, item, external, type){
            item.order = index;
            if(item.SObjectLayoutId === undefined){
                item.SObjectLayoutId = $scope.layout.id;
                $scope.openSectionPropertiesModal(item,index);
            }
            return item;
        };
        $scope.widgetsDropCallBack = function(event, index, item, external, type){
            item.order = index;
            if(item.SObjectLayoutId === undefined){
                item.SObjectLayoutId = $scope.layout.id;
                // $scope.openSectionPropertiesModal(item,index);
            }
            return item;
        };
        $scope.relatedListsDropCallBack = function(event, index, item, external, type,dispaySection){
            item.order = index;
            item.dispaySection=dispaySection;
            if(item.SObjectLayoutId === undefined){
                item.SObjectLayoutId = $scope.layout.id;
                item.SObjectLayoutFields = [];
                angular.forEach(item.SObject.SObjectFields,function(field, fieldIndex){
                    if(field.name === 'Name' || field.name === 'CreatedDate' || field.name === 'CreatedById' || field.name === 'LastModifiedDate' || field.name === 'LastModifiedById'){
                        item.SObjectLayoutFields.push({
                            SObjectField: field,
                            label: field.label,
                            type: 'Related-List-Field',
                            hidden: false,
                            deleted: false,
                        });
                    }
                });
                var itemIndex = 0;
                var newRLists=[];
                
                angular.forEach($scope.relatedLists,function(i, _index){
                    if(i.dispaySection == dispaySection){
                        if(itemIndex===index){
                            itemIndex++;
                        }
                        i.order = itemIndex;
                        itemIndex++;
                        newRLists.push(i);
                    }
                });
                angular.forEach($scope.relatedLists,function(i, _index){
                    if(i.dispaySection != dispaySection){
                        if(itemIndex===index){
                            itemIndex++;
                        }
                        i.order = itemIndex;
                        itemIndex++;
                        newRLists.push(i);
                    }
                });
                $scope['relatedLists']=newRLists;
                $scope.openRelatedListPropertiesModal(item,index);
            }
            return item;
        };
        $scope.fieldsDropCallBack = function(event, index, item, external, type, section, columnNumber){
            var sectionFields = section.columns[0];
            if(section.columns.length === 2){
                sectionFields = section.columns[0].concat(section.columns[1]);
            }
            if($scope.isDuplicate(sectionFields,item)){
                return false;
            }
            item.type = 'Layout-Section-Field';
            item.column = columnNumber;
            item.order = index;
            item.readonly = (section.readonly !== undefined) ? section.readonly : false;
            item.active = (item.active !== undefined) ? item.active : true;
            item.enable = (item.enable !== undefined) ? item.enable : true;
            
            angular.forEach(section.columns,function(fields){
                angular.forEach(fields,function(field,fieldOrder){
                    field.order = fieldOrder;
                });
            });
            

            // angular.forEach(section.columns[columnNumber-1],function(field,fieldIndex){
            //     alert(field.order);
            //      alert(fieldIndex);
            //     field.order = fieldIndex;
            // });
            
            return item;
        };
        $scope.isDuplicate = function(fields,item){
            var duplicate = false;
            angular.forEach(fields,function(field,index){
                if(!duplicate){
                    if(field.SObjectField.id === item.SObjectField.id && item.type === null && !field.deleted){
                        duplicate = true;
                    }
                }
            });
            return duplicate;
        };
        $scope.loadEditLayoutContents = function(){
            if(!$scope.blockUI.editEditLayout.state().blocking  && $scope.layout.SObject != null){
                $scope.blockUI.editEditLayout.start('Loading ...');
                layoutService.loadEditLayoutContents($scope.layout)
                    .success(function(response){
                        if(response.success === true){
                            $scope.layoutSections = response.data.sObjectLayoutSections;
                            layoutService.loadLayoutRelatedLists($scope.layout)
                                .success(function(response2){
                                    if(response2.success === true){
                                        $scope.relatedLists = response2.data.sObjectLayoutRelatedLists;
                                    }else{
                                        $dialog.alert('Error occured while loading layout related lists.','Error','pficon pficon-error-circle-o');
                                    }
                                    $scope.blockUI.editEditLayout.stop();
                                })
                                .error(function(response2){
                                    $dialog.alert('Server error occured while loading layout related lists.','Error','pficon pficon-error-circle-o');
                                    $scope.blockUI.editEditLayout.stop();        
                                });
                        }else{
                            $dialog.alert('Error occured while loading layout contents.','Error','pficon pficon-error-circle-o');
                            $scope.blockUI.editEditLayout.stop();
                        }
                    })
                    .error(function(response){
                        $dialog.alert('Server error occured while loading layout contents.','Error','pficon pficon-error-circle-o');
                        $scope.blockUI.editEditLayout.stop();
                    });
            }
        };
        $scope.saveLayoutRelatedLists = function(){
            if(!$scope.blockUI.editEditLayout.state().blocking  && $scope.layout.SObject != null){
                if($scope.relatedLists !== undefined && $scope.relatedLists.length > 0){
                    $scope.blockUI.editEditLayout.start('Saving layout related lists...');
                    layoutService.saveLayoutRelatedLists({ 
                        relatedLists: $scope.relatedLists,
                        type: $scope.layout.type,
                        id: $scope.layout.id
                    })
                    .success(function(response){
                        $scope.blockUI.editEditLayout.stop();
                        if(response.success === true){
                            $scope.loadEditLayoutContents();
                        }else{
                            $dialog.alert('Error occured while saving layout related lists.','Error','pficon pficon-error-circle-o');
                        }
                    })
                    .error(function(response){
                        $scope.blockUI.editEditLayout.stop();
                        $dialog.alert('Server error occured while saving layout related lists.','Error','pficon pficon-error-circle-o');
                    });
                }else{
                    $scope.loadEditLayoutContents();
                }
            }
        };
        $scope.isValidLayout = function(){
            var errorCount = 0;
            angular.forEach($scope.layoutSections, function(section){
                if(!section.isComponent){
                    angular.forEach(section.columns, function(fields){
                        angular.forEach(fields, function(field){
                            if((field.SObjectField.type === 'picklist' || field.SObjectField.type === 'multipicklist') && field.SObjectField.controllerName){
                                var controllerField = $scope.controllerField(field.SObjectField.controllerName);
                                if(controllerField === undefined){
                                    field.error = 'Parent field is missing!';
                                    errorCount++;
                                }else{
                                    delete field.error;
                                }
                            }
                        });
                    });
                }
            });
            return errorCount === 0;
        };
        $scope.controllerField = function(name){
            var controllerField = undefined;
            angular.forEach($scope.layoutSections, function(section){
                angular.forEach(section.columns, function(fields){
                    angular.forEach(fields, function(field){
                         if(field.SObjectField.name === name && !field.deleted && controllerField === undefined){
                             controllerField = field;
                             return controllerField;
                         }
                    });
                });
            }); 
            return controllerField;
        };
        $scope.saveLayout = function(){
            if(!$scope.isValidLayout()){
                return;
            }
            if(!$scope.blockUI.editEditLayout.state().blocking  && $scope.layout.SObject != null){
                $scope.blockUI.editEditLayout.start('Saving layout...');
                layoutService.saveEditLayout({ 
                    layoutSections: $scope.layoutSections,
                    type: $scope.layout.type,
                    id: $scope.layout.id
                })
                .success(function(response){
                    $scope.blockUI.editEditLayout.stop();
                    if(response.success === true){
                        // $scope.loadEditLayoutContents();
                        $scope.saveLayoutRelatedLists();
                    }else{
                        $dialog.alert('Error occured while saving layout.','Error','pficon pficon-error-circle-o');
                    }
                })
                .error(function(response){
                    $scope.blockUI.editEditLayout.stop();
                    $dialog.alert('Server error occured while saving layout.','Error','pficon pficon-error-circle-o');
                });
            }
        };
        $scope.initEditLayoutBlockUiBlocks = function(){
            $scope.blockUI.editEditLayout = blockUI.instances.get('editEditLayout');
        };
        $scope.init = function(){
            console.log('AdminLayoutsEditEditController loaded!');
            $scope.initEditLayoutBlockUiBlocks();
            $scope.loadEditLayoutContents();
        };
        $scope.init();
    }
]);