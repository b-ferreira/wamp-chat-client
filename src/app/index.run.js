(function() {
  'use strict';

  angular
    .module('wampChatClient')
    .run(runBlock);

  /** @ngInject */
  function runBlock($wamp, $rootScope, $state) {
    $wamp.open();

    $rootScope.$on('$stateChangeStart', function(evt, to, params) {
      // Checks if there's an user, if not redirecto to home.
      if (to.name == "home.chat" && (angular.isUndefined(params) || angular.isUndefined(params.user))) {
        evt.preventDefault();
        $state.go("home", params);
      } else if (to.redirectTo) {
        evt.preventDefault();
        $state.go(to.redirectTo, params)
      }
    });
  }
})();
