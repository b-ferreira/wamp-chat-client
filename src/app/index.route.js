(function() {
  'use strict';

  angular
    .module('wampChatClient')
    .config(routerConfig);

  /** @ngInject */
  function routerConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
      // Home state
      .state('home', {
        url: '/',
        redirectTo: "login",
        views: {
          'content@':{
            templateUrl: "app/main/main.html"
          }
        },
        controller: 'MainController',
        controllerAs: 'main'
      })

      // Login state
      .state('home.login', {
        url: "login",
        views: {
          'innerContent': {
            templateUrl: "app/login/login.html",
            controller: "LoginController",
            controllerAs: "vm"
          }
        }
      });

    $urlRouterProvider.otherwise('/');
  }

})();
