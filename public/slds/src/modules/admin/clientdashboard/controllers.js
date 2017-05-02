'use strict';

admin.controller('AdminClientDashboardDesignController',[
            '$scope','$rootScope','$state','$adminModals','genericComponentService','clientDashboardContainerService','$dialog',
    function($scope , $rootScope , $state , $adminModals , genericComponentService , clientDashboardContainerService , $dialog){
        $scope.loadDashboardContainers = ()=>{
            // $scope.blockUI.loadComponents.start('Loading components...');

            clientDashboardContainerService.loadClientDashboardContainers()
                .success((response)=>{
                    if(response.success){
                        $scope.dashboardContainers = response.data.containers;
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                    // $scope.blockUI.loadComponents.stop();
                })
                .error((response)=>{
                    $dialog.alert('Error occured while loading dashboard containers.','Error','pficon pficon-error-circle-o');
                    // $scope.blockUI.loadComponents.stop();
                });
        };
        $scope.saveDashboardConfiguration = ()=>{
            console.log($scope.dashboardContainers);
            $scope.reOrder($scope.dashboardContainers);
            // if(!$scope.blockUI.editEditLayout.state().blocking  && $scope.layout.SObject != null){
                // $scope.blockUI.editEditLayout.start('Saving layout...');
                clientDashboardContainerService.saveClientDashboardContainers({ 
                    containers: $scope.dashboardContainers
                })
                .success((response)=>{
                    // $scope.blockUI.editEditLayout.stop();
                    if(response.success === true){
                        // $scope.loadEditLayoutContents();
                        $scope.loadDashboardContainers();
                    }else{
                        $dialog.alert('Error occured while saving layout.','Error','pficon pficon-error-circle-o');
                    }
                })
                .error((response)=>{
                    // $scope.blockUI.editEditLayout.stop();
                    $dialog.alert('Server error occured while saving layout.','Error','pficon pficon-error-circle-o');
                });
            // }
        };
        $scope.containerDropCallBack = (event, index, item, external, type)=>{
            item.order = index;
            if(angular.isUndefined(item.label))
                $scope.dashboardContainerPropertiesModal(item, index);
            return item;
        };
        $scope.dashboardContainerPropertiesModal = (container,index)=>{
            $adminModals.adminClientDashboardContainerProperties({
                container: angular.copy(container),
            },(container)=>{
                $scope.dashboardContainers[index] = container;
            });
        };
        $scope.componentDropCallBack = (event, index, item, external, type, container, containerIndex, columnNumber)=>{
            item.order = index;
            if(angular.isUndefined(item.columns))
                item.columns = 3;
            if(angular.isUndefined(item.label))
                $scope.dashboardContainerComponentPropertiesModal(containerIndex, item, index);
            return item;
        };
        $scope.dashboardContainerComponentPropertiesModal = (containerIndex, component, index)=>{
            delete component.SObject
            component.component = angular.copy(component);
            component.deleted = component.component.deleted;
            component.order = component.component.order;
            component.active = component.component.active;
            component.columns = component.component.columns;
            component.title = component.component.title;
            delete component.id;
            delete component.component.deleted;
            delete component.component.order;
            delete component.component.columns;
            $adminModals.adminClientDashboardContainerComponentProperties({
                component: angular.copy(component),
            },(component)=>{
                $scope.dashboardContainers[containerIndex].components[index] = component;
            });
        };
        $scope.reOrder = (items)=>{
            var itemIndex = 0;
            angular.forEach(items, (item)=>{
                item.order = itemIndex;
                itemIndex++;
                if(item.hasOwnProperty('components') && item.components.length > 0){
                    $scope.reOrder(item.components);
                }
            });
        }
        $scope.removeAndReorder = (items,item,index)=>{
            item.deleted = true;
            if(item.id === undefined){
                items.splice(index,1);
            }
            
            var itemIndex = 0;
            angular.forEach(items,(i, _index)=>{
                if(!i.deleted){
                    i.order = itemIndex;
                    itemIndex++;
                }
            });
            
            if(item.components && item.components.length > 0){
                angular.forEach(item.components,(component)=>{
                    component.deleted = true;
                });
            }
        };
        $scope.loadDashboardComponents = ()=>{
            // $scope.blockUI.loadComponents.start('Loading components...');

            genericComponentService.loadDashboardComponent({active: true})
                .success((response)=>{
                    if(response.success){
                        angular.forEach(response.data.components, (component)=>{
                            component.deleted = false;
                        });
                        $scope.components = response.data.components;
                    }else{
                        $dialog.alert(response.message,'Error','pficon pficon-error-circle-o');
                    }
                    // $scope.blockUI.loadComponents.stop();
                })
                .error((response)=>{
                    $dialog.alert('Error occured while loading components.','Error','pficon pficon-error-circle-o');
                    // $scope.blockUI.loadComponents.stop();
                });
        };
        $scope.init = ()=>{
            console.log('AdminClientDashboardDesignController loaded!');
            $scope.sidePanel = 'slds/views/admin/clientdashboard/side-panel.html';
            $scope.dropZone = 'slds/views/admin/clientdashboard/drop-zone.html';
            $scope.dashboardContainers = [];
            $scope.containers = [{
                    title: 'My Task Container',
                    type: 'container',
                    deleted: false,
                    active: true,
                    columns: 0,
                    components: [],
                    allowedType: 'ClientDashbordMyTaskContainerComponent'
                },{
                    title: 'Chart Container',
                    type: 'container',
                    deleted: false,
                    active: true,
                    columns: 0,
                    components: [],
                    allowedType: 'ClientDashbordChartContainerComponent'
                }
            ];
            $scope.loadDashboardComponents();
            $scope.loadDashboardContainers();
        };
        $scope.init();
    }
]);