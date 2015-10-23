(function() {
    'use strict';
    angular
        .module('wampChatClient')
        .controller('LoginController', LoginController);
    LoginController.$inject = ['$scope', '$wamp', '$state', 'UtilsService'];
    /* @ngInject */
    function LoginController($scope, $wamp, $state, UtilsService) {
        var vm = this;
        vm.scope = $scope;

        /*
         * VIEW BINDINGS
         */
        vm.login = login;

        activate();
        ////////////////
        
        /**
         * This function is attatched to login button on view, 
         * it'll notify another users using "com.chat.login" topic.
         */
        function login() {
            if (angular.isDefined(vm.username)) {

                // User info object.
                var user = {
                    username: vm.username,
                    guid: UtilsService.func.guid()
                };

                // Publish user login to other clients.
                $wamp.publish('com.chat.newparticipant', [user]);

                // Navigate to chat state.
                $state.go('home.chat', {user:user});
            }
        }

        function activate() {}
    }
})();