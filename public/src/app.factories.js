'use strict';

app.factory('$appCache', [
            '$cacheFactory', 
    function($cacheFactory){
        return $cacheFactory('APP_DATA_CACHE');
    }
]);

app.factory('MultiObjectCriteriaHelper', function($filter,$rootScope){
	var createGroupExpression = function(criteria,exp,operator,model){
		exp += "(";
		angular.forEach(criteria.group.rules,function(rule){
			if(rule.group){
				exp += createGroupExpression(rule,"",rule.group.operator,model);
			}else{
				exp += createRuleExpression(rule,model);
			}
			exp += " " + operator + " ";
		})
		exp = exp.slice(0,-4);
		if(exp !== "")
            exp += ")";
		return exp;
	}
	var createRuleExpression = function(rule,model){
		var exp = "";
		var SObjectName = ((rule.SObjectName.indexOf('-') > -1) ? rule.SObjectName.split('-')[0] : rule.SObjectName);
		if(rule.field){
			var modelValue = model[SObjectName][rule.field.SObjectField.name] ;
			var ruleValue = rule.data[rule.field.SObjectField.name];
			var type=rule.field.SObjectField.type;
			if(rule.data.fieldname){
				if(model[SObjectName][rule.field.SObjectField.relationshipName]!==null && model[SObjectName][rule.field.SObjectField.relationshipName]){
					modelValue = model[SObjectName][rule.field.SObjectField.relationshipName][rule.data.fieldname] ;	
				}
				ruleValue = JSON.parse($rootScope.user().userdata)[rule.data.fieldname];
				type="picklist";
			}

			switch(type){ // double,currency,string,email,picklist,boolean,reference
			case "double":
			case "currency":
				modelValue 	= (modelValue) 	? modelValue 	: 0;
				ruleValue 	= (ruleValue) 	? ruleValue 	: 0;
				break;
				
			case "string":
			case "email":
			case "picklist":
				modelValue 	= (modelValue) 	? "'" + modelValue 	+ "'" : "''";
				ruleValue 	= (ruleValue) 	? "'" + ruleValue 	+ "'" : "''";
				break;

			case "reference":
				modelValue 	= (modelValue) 	? "'" + $filter('limitTo')(modelValue, 15, 0) 	+ "'" : "''";
				ruleValue 	= (ruleValue) 	? "'" + $filter('limitTo')(ruleValue, 15, 0) 	+ "'" : "''"
				break;
			
			case "boolean":
				modelValue 	= (modelValue) 	? modelValue 	: false;
				ruleValue 	= (ruleValue) 	? ruleValue 	: false;
				break;
			}
			exp += "(" + modelValue + " " + rule.condition + " " + ruleValue + ")";
		}
		return exp;
	};
	
	return {
		validate: function(criteria,model,throwException){
			var strCriteria = JSON.stringify(angular.copy(criteria));
			var strGroupNode = JSON.stringify(this.groupNode());
			if(strCriteria == strGroupNode){
				criteria = null;
				return null;
			}
			
			var exp = createGroupExpression(criteria,"",criteria.group.operator,model);
			var result = false;
			try{
				result = exp === "" ? true : eval(exp);
			}catch(e){
				if(throwException){
					throw "Invalid Criteria!!";
				}
				result = false;
			}
			return result;
		},
		conditionList: function(){
			return  [{ sign: '==', 		label: 'equal',						types : 'string,double,date,currency,boolean,picklist' },
	                 { sign: '<>', 		label: 'not equal',					types : 'string,double,date,currency,boolean,picklist' },
	                 { sign: '<', 		label: 'less than',					types : 'double,date,currency' },
	                 { sign: '>', 		label: 'greater than',				types : 'double,date,currency' },
					 { sign: '<=', 		label: 'less than or equal',		types : 'double,date,currency' },
					 { sign: '>=', 		label: 'greater than or equal',		types : 'double,date,currency' }];
		},
		namespaceValues: function(){
			return ['USER_ID','LOGGED_IN_USER_DELEGATION_ID'];
		},
		groupNode: function(){
			return {
				type		:'GROUP',
				operator	:'&&',
				rules		:[this.ruleNode()]
			};
		},
		ruleNode: function(){
			return {
				type		:'RULE',
				field		:null
			};
		}, 
		fieldList : function(criteria){
			var createGroupExpression = function(criteria,field){
				angular.forEach(criteria.group.rules,function(rule){
					if(rule.group){
						createGroupExpression(rule,field);
					}else{
						if(rule.field){
							field.push(rule.field);
						}
					}
				})
			}
			

			var strCriteria = JSON.stringify(angular.copy(criteria));
			var strGroupNode = JSON.stringify(this.groupNode());
			if(strCriteria == strGroupNode){
				criteria = null;
				return null;
			}
			var rtnFields=[];
			createGroupExpression(criteria,rtnFields);

			return rtnFields;
		}
	};
});

app.factory('CriteriaHelper', function($filter,$rootScope){
	var createGroupExpression = function(criteria,exp,operator,model){
		exp += "(";
		angular.forEach(criteria.group.rules,function(rule){
			if(rule.group){
				exp += createGroupExpression(rule,"",rule.group.operator,model);
			}else{
				exp += createRuleExpression(rule,model);
			}
			exp += " " + operator + " ";
		})
		exp = exp.slice(0,-4);
		if(exp !== "")
            exp += ")";
		return exp;
	}
	var createRuleExpression = function(rule,model){
		var exp = "";
		if(rule.field){
			var modelValue = model[rule.field.SObjectField.name] ;
			var ruleValue = rule.data[rule.field.SObjectField.name];
			var type=rule.field.SObjectField.type;
			if(rule.data.fieldname){
				if(model[rule.field.SObjectField.relationshipName]!==null && model[rule.field.SObjectField.relationshipName]){
					modelValue = model[rule.field.SObjectField.relationshipName][rule.data.fieldname] ;	
				}
				ruleValue = JSON.parse($rootScope.user().userdata)[rule.data.fieldname];
				type="picklist";
			}

			switch(type){ // double,currency,string,email,picklist,boolean,reference
			case "double":
			case "currency":
				modelValue 	= (modelValue) 	? modelValue 	: 0;
				ruleValue 	= (ruleValue) 	? ruleValue 	: 0;
				break;
				
			case "string":
			case "email":
			case "picklist":
				modelValue 	= (modelValue) 	? "'" + modelValue 	+ "'" : "''";
				ruleValue 	= (ruleValue) 	? "'" + ruleValue 	+ "'" : "''";
				break;

			case "reference":
				modelValue 	= (modelValue) 	? "'" + $filter('limitTo')(modelValue, 15, 0) 	+ "'" : "''";
				ruleValue 	= (ruleValue) 	? "'" + $filter('limitTo')(ruleValue, 15, 0) 	+ "'" : "''"
				break;
			
			case "boolean":
				modelValue 	= (modelValue) 	? modelValue 	: false;
				ruleValue 	= (ruleValue) 	? ruleValue 	: false;
				break;
			}
			exp += "(" + modelValue + " " + rule.condition + " " + ruleValue + ")";
		}
		return exp;
	};
	
	return {
		validate: function(criteria,model,throwException){
			var strCriteria = JSON.stringify(angular.copy(criteria));
			var strGroupNode = JSON.stringify(this.groupNode());
			if(strCriteria == strGroupNode){
				criteria = null;
				return null;
			}
			
			var exp = createGroupExpression(criteria,"",criteria.group.operator,model);
			var result = false;
			try{
				result = exp === "" ? true : eval(exp);
			}catch(e){
				if(throwException){
					throw "Invalid Criteria!!";
				}
				result = false;
			}
			return result;
		},
		conditionList: function(){
			return  [{ sign: '==', 		label: 'equal',						types : 'string,double,date,currency,boolean,picklist' },
	                 { sign: '<>', 		label: 'not equal',					types : 'string,double,date,currency,boolean,picklist' },
	                 { sign: '<', 		label: 'less than',					types : 'double,date,currency' },
	                 { sign: '>', 		label: 'greater than',				types : 'double,date,currency' },
					 { sign: '<=', 		label: 'less than or equal',		types : 'double,date,currency' },
					 { sign: '>=', 		label: 'greater than or equal',		types : 'double,date,currency' }];
		},
		namespaceValues: function(){
			return ['USER_ID','LOGGED_IN_USER_DELEGATION_ID'];
		},
		groupNode: function(){
			return {
				type		:'GROUP',
				operator	:'&&',
				rules		:[this.ruleNode()]
			};
		},
		ruleNode: function(){
			return {
				type		:'RULE',
				field		:null
			};
		}, 
		fieldList : function(criteria){
			var createGroupExpression = function(criteria,field){
				angular.forEach(criteria.group.rules,function(rule){
					if(rule.group){
						createGroupExpression(rule,field);
					}else{
						if(rule.field){
							field.push(rule.field);
						}
					}
				})
			}
			

			var strCriteria = JSON.stringify(angular.copy(criteria));
			var strGroupNode = JSON.stringify(this.groupNode());
			if(strCriteria == strGroupNode){
				criteria = null;
				return null;
			}
			var rtnFields=[];
			createGroupExpression(criteria,rtnFields);

			return rtnFields;
		}
	};
});