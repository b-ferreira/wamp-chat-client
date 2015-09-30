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

    var wsuri;
    if (document.location.origin == "file://") {
       wsuri = "ws://127.0.0.1:9000/ws";
    } else {
       wsuri = (document.location.protocol === "http:" ? "ws:" : "wss:") + "//" +
                   document.location.host + "/ws";
    }

    // WAMP config
    $wampProvider.init({
      url: wsuri,
      realm: 'realm1'
    });
  }
})();
