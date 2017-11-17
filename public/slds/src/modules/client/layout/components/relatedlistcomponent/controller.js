'use strict';

client.controller('RelatedListComponentController', [
	'$scope', '$http', 'blockUI', '$dialog', '$state', 'clientSObjectService',
	function ($scope, $http, blockUI, $dialog, $state, clientSObjectService) {

		var componentBlock = blockUI.instances.get("RelatedListComponentBlock" + $scope.section.id);
		$scope.search = function (page, pageSize) {
			var whereClauseString = $scope.section.Component.ComponentDetails[0].configuration.whereClause;
			if (whereClauseString != undefined && whereClauseString != null) {
				while (whereClauseString.indexOf("{") != -1) {
					if ($scope.ctrl.stateParamData.record[whereClauseString.substring(whereClauseString.indexOf("{") + 1, whereClauseString.indexOf("}"))] != null) {
						whereClauseString = whereClauseString.substring(0, whereClauseString.indexOf("{"))
							+ $scope.ctrl.stateParamData.record[whereClauseString.substring(whereClauseString.indexOf("{") + 1, whereClauseString.indexOf("}"))]
							+ whereClauseString.substring(whereClauseString.indexOf("}") + 1)
					}
					else {
						console.log(whereClauseString.substring(whereClauseString.indexOf("{") + 1, whereClauseString.indexOf("}")) + "Field not configured in layout")
						break;
					}
				}
			}
			var queryObject = {
				sObject: { name: $scope.section.Component.ComponentDetails[0].configuration.detailSObjectName },
				selectFields: $scope.section.Component.ComponentDetails[0].configuration.fields,
				whereClauseString: whereClauseString,
				limit: pageSize,
				page: page
			};
			componentBlock.start('Loading line items...');

			clientSObjectService.search(queryObject)
				.success(function (response) {
					if (response.success) {
						$scope.searchResult = response.data.searchResult;
						$scope.currentPage = response.data.currentPage;
						$scope.hasMore = response.data.hasMore;
					} else {
						$dialog.alert(response.message, 'Error', 'pficon pficon-error-circle-o');
					}
					componentBlock.stop();
				})
				.error(function (response) {
					$dialog.alert('Server error occured while querying data.', 'Error', 'pficon pficon-error-circle-o');
					componentBlock.stop();
				});
		};

		$scope.showlink = function () {
			if ($scope.section.Component.catagory == 'RelatedListComponent' && $scope.section.Component.detailSObject
				&& $scope.section.Component.detailSObject.keyPrefix != null
				&& $scope.section.Component.detailSObject.keyPrefix != "") {
				return $state.href('client.' + $scope.section.Component.detailSObject.keyPrefix + '.' + 'details');
			}
		}

		$scope.doAction = function (record) {
			var _editAction = undefined;
			var editCriteria = undefined;
			angular.forEach($scope.section.Component.detailSObject.SObjectLayouts, function (layout) {
				if (layout.type == 'Edit' & layout.active == true) {
					_editAction = {
						type: 'record',
						label: 'edit',
						state: 'client.' + $scope.section.Component.detailSObject.keyPrefix + '.' + 'edit',
					}
				}
				else if (layout.type == 'List') {
					angular.forEach(layout.btnCriteria, function (btnCriteria) {
						if (btnCriteria.keyName == 'Edit') {
							editCriteria = btnCriteria.criteria;
						}
					});
				}
			});
			if (_editAction != undefined) {
				_editAction['criteria'] = editCriteria;
			}
			$state.go('client.' + $scope.section.Component.detailSObject.keyPrefix + '.' + 'details', {
				data: {
					record: record,
					editAction: _editAction,
					isFromRelatedList: true,
					parentStateParamData: $state.params.data,
					parentState: $state.current.name,
				}
			});
		};

		$scope.init = function () {
			$scope.pageSize = 25;
			$scope.currentPage = 0;
			$scope.search(1, $scope.pageSize);
		};
		$scope.init();
	}
]);