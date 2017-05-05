'use strict';

var app = angular.module('App',[
    'app.directive','app.dialog','app.auth','app.language','app.admin','app.client',
    'ui.router',
    'ngCookies',
    'ngStorage',
    'patternfly',
    'blockUI',
    'angularModalService',
    'angular.filter',
    'frapontillo.bootstrap-switch',
    'datetimepicker',
    'anguFixedHeaderTable',
    'jsonFormatter'
]);

var stateProviderRef = null, _$translateProvider = null;

app.run(function($rootScope,$state,$cookies,$templateCache,$appCache,$translate,$localStorage){
    $localStorage.$default({translations: {}});
    $rootScope.configureLanguages =function() {
        if(_$translateProvider != null)
        {
            var user = $rootScope.user();
            angular.forEach($localStorage.translations, function(translation, key){
                if(angular.isUndefined(_$translateProvider.translations(key)) || _$translateProvider.translations(key) == null){
                    var translationObject = {};
                    angular.forEach(translation, function(translation){
                        translationObject[translation.label] = translation.translation;
                    });
                    _$translateProvider.translations(key, translationObject);
                }
            });
            _$translateProvider.use(user.Language.code);
            _$translateProvider.useSanitizeValueStrategy(null);
        }    
    };
    
    $rootScope.title = function(){
        return $state.current.title;  
    };
    
    $rootScope.logout = function(){
        $cookies.remove('user');
        $appCache.removeAll();
        $localStorage.translations = {};
        // var clientTemplateUrls = $cookies.getObject('clientTemplateUrls');
        // angular.forEach(clientTemplateUrls,function(templateUrl){
        //     console.log($templateCache.get(templateUrl));
        //     $templateCache.remove(templateUrl);
        //     console.log(templateUrl);
        //     console.log($templateCache.get(templateUrl));
        // });
        // console.log(clientTemplateUrls);
        
        location.reload(true);
        //$rootScope.redirectTo();
    };
    
    $rootScope.login = function(credentials){
        $cookies.putObject('user',credentials);
        $rootScope.redirectTo();
    };
    
    $rootScope.isLoginPage = function(){
        return $state.current.name === 'login' || $state.current.name === 'resetpasswordlink' || $state.current.name === 'resetpassword' ;  
    };
    
    $rootScope.updateUserLanguage = function(user){
        $cookies.putObject('user', user);
    };
    $rootScope.user = function(){
        return $cookies.getObject('user');
    };
    
    $rootScope.redirectTo = function(state){
        // console.log('app.redirectTo : ' + state);
        
        if(state){
            $state.go(state);
        }else{
            // console.log($rootScope.user());
            var user = $rootScope.user(); 
            if(user === undefined){
                $state.go('login');
            }else if(user.isAdmin){
                $state.go('admin');
            }else{
                $state.go('client');
            }
        }
    };
    
    $rootScope.configureStateProviderStates = function(states,callback){
        var homeState = null;
        if(states){
            // var templateUrls = [];
            angular.forEach(states,function(state,index){
                // templateUrls.push(state.templateUrl);
                if($state.get(state.name) === null){
                    // console.log(state);
                    stateProviderRef.state(state.name,JSON.parse(JSON.stringify(state)));
                }
                if(state.isHomePage){
                    homeState = state.name;
                }
            });
            // $cookies.putObject('clientTemplateUrls', templateUrls);
            // console.log(templateUrls);
        }
        $rootScope.configureLanguages();
        callback && callback(homeState);
    };
    
    // $rootScope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams,options){
        // console.info('$stateChangeStart START');
        // console.log(toState);
        // console.log(fromState);
        // console.info('$stateChangeStart END');
    // });
    
    $rootScope.encodeURI = function(URI){
		return encodeURIComponent(URI);
	};
});