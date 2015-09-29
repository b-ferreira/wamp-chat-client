(function() {
  'use strict';

  angular
    .module('wampChatClient')
    .run(runBlock);

  /** @ngInject */
  function runBlock($wamp, $rootScope, $state) {
    $wamp.open();

    $rootScope.$on('$stateChangeStart', function(evt, to, params) {
      if (to.redirectTo) {
        evt.preventDefault();
        $state.go(to.redirectTo, params)
      }
    });
  }

})();
