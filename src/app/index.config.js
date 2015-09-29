(function() {
  'use strict';

  angular
    .module('wampChatClient')
    .config(config);

  /** @ngInject */
  function config($logProvider, toastrConfig, $wampProvider) {
    // Enable log
    $logProvider.debugEnabled(true);

    // Set options third-party lib
    toastrConfig.allowHtml = true;
    toastrConfig.timeOut = 3000;
    toastrConfig.positionClass = 'toast-bottom-right';
    toastrConfig.preventDuplicates = true;
    toastrConfig.progressBar = true;

    // WAMP config
    $wampProvider.init({
      url: 'ws://127.0.0.1:9000/ws',
      realm: 'realm1'      
    });
  }
})();
