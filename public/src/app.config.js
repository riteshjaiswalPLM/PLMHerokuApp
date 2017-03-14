'use strict';

app.config(function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, blockUIConfig, NotificationsProvider) {
    /**
     *  BLOCK-UI CONFIGURATION
     */
    var blockUiConfiguration = function(){
        // Change the default overlay message
        blockUIConfig.message = 'Loading . . .'; // i.e. Default
        // delay time in ms
        blockUIConfig.delay = 0;
        // Enable browser navigation blocking
        blockUIConfig.blockBrowserNavigation = true;
        // Disable automatically blocking of the user interface
        blockUIConfig.autoBlock = true;
        // Disable auto body block
        blockUIConfig.autoInjectBodyBlock = true;
        // Disable clearing block whenever an exception has occurred
        blockUIConfig.resetOnException = true;
        
        // Tell the blockUI service to ignore certain requests
        blockUIConfig.requestFilter = function(config) {
            // If the request starts with '/api/**' ...
            if(config.url.match(/^\/api($|\/).*/)) {
                return false; // ... don't block it.
            }
        };
    };
    blockUiConfiguration();
    
    /**
     * Patternfly Notification Configurations
     */
    NotificationsProvider
            .setDelay(5000)
            .setVerbose(false)
            .setPersist({
               'error': false,
               'httpError': false,
               'warn': false 
            });
    
    
    $locationProvider.html5Mode(true);
    
    $urlRouterProvider.otherwise('/');
    stateProviderRef = $stateProvider;
    $stateProvider
        .state('app', {
            url: '/',
            templateUrl: 'views/app.html',
            controller: 'AppController',
        });
        
    $httpProvider.interceptors.push('httpAuthInterceptor');
});