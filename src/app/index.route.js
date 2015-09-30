(function() {
  'use strict';

  angular
    .module('wampChatClient')
    .config(routerConfig);

  /** @ngInject */
  function routerConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
      // Home state, i.e. login state.
      .state('home', {
        url: '/',
        views: {
          'content@':{
            templateUrl: "app/login/login.html",
            controller: "LoginController",
            controllerAs: "vm"
          }
        },
        params: {
          user: undefined
        }
      })

      .state('home.chat', {
        url: "chat",
        views: {
          'content@': {
            templateUrl: "app/chat/chat.html",
            controller: "ChatController",
            controllerAs: "chat"
          }
        }
      });

    $urlRouterProvider.otherwise('/');
  }
})();
