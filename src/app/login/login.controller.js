(function() {
    'use strict';
    angular
        .module('wampChatClient')
        .controller('LoginController', LoginController);
    LoginController.$inject = ['$scope', '$wamp', '$log'];
    /* @ngInject */
    function LoginController($scope, $wamp, $log) {
        var vm = this;

        /*
        	VIEW BINDINGS
        */
        vm.login = login;

        function login() {

        	$log.info(vm.username);
			if (!angular.isUndefined(vm.username)) {
				$wamp.call('com.chat.login', [vm.username]).then(
					function(res) {
						$log.info("Login done!");
					},
					function(error) {
						$log.info("Login error!");
					}
				);
			}
		}
        
        activate();
        ////////////////
        function activate() {
        }
    }
})();