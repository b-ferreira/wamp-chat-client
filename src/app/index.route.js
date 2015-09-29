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
        redirectTo: "home.login",
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
      })

      .state('home.chat', {
        url: "chat",
        views: {
          'innerContent': {
            templateUrl: "app/chat/chat.html",
            controller: "ChatController",
            controllerAs: "chat"
          }
        }
      });

    $urlRouterProvider.otherwise('/');
  }
})();
