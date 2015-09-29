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
        function login() {
            if (!angular.isUndefined(vm.username)) {
                $wamp.call('com.chat.login', [vm.username, UtilsService.func.guid()]).then(
                    function(res) {
                        vm.loginStatus = 'ok';
                        $state.go('home.chat', {user:res.data});
                    },
                    function(error) {
                        vm.loginStatus = 'fail';
                    }
                );
            }
        }

        function activate() {}
    }
})();