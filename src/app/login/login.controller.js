(function() {
    'use strict';
    angular
        .module('wampChatClient')
        .controller('LoginController', LoginController);
    LoginController.$inject = ['$scope', '$wamp', '$log', '$state'];
    /* @ngInject */
    function LoginController($scope, $wamp, $log, $state) {
        var vm = this;
        vm.scope = $scope;

        /*
         * VIEW BINDINGS
         */
        vm.login = login;

        activate();
        ////////////////
        function login() {
            $log.info(vm.username);
            if (!angular.isUndefined(vm.username)) {
                $wamp.call('com.chat.login', [vm.username]).then(
                    function(res) {
                        vm.loginStatus = 'ok';
                        $state.go('home.chat');
                        $log.info("Login done!");
                    },
                    function(error) {
                        vm.loginStatus = 'fail';
                        $log.error("Login fail!");
                    }
                );
            }
        }

        function activate() {}
    }
})();