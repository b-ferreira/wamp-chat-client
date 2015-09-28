(function() {
  'use strict';

  angular
    .module('wampChatClient')
    .run(runBlock);

  /** @ngInject */
  function runBlock($wamp) {
    $wamp.open();
  }

})();
