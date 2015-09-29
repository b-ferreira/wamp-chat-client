(function() {
    'use strict';
    angular
        .module('wampChatClient')
        .controller('ChatController', ChatController);
    ChatController.$inject = ['$wamp', '$rootScope', '$state'];
    /* @ngInject */
    function ChatController($wamp, $rootScope, $state) {
        var chat = this;

        /*
         * VIEW BINDINGS
         */
        chat.participantList = [];
        chat.logout = logout;

        activate();
        ////////////////
        function logout() {
            $wamp.call('com.chat.logout', [$rootScope.username]).then(
                function(res) {
                    $state.go('home.login');
                }
            );
        }

        function activate() {
        	$wamp.call('com.chat.getparticipants').then(
        		function(res) {
        			chat.participantList = res;
        		}
        	);
        }
    }
})();