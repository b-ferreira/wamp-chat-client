(function() {
    'use strict';
    angular
        .module('wampChatClient')
        .service('UtilsService', UtilsService);
    UtilsService.$inject = [];
    /* @ngInject */
    function UtilsService() {
        this.func = func;

        /*
		 * VIEW BINDINGS
         */
        func.guid = guid;

        ////////////////
        // Generates a random GUID.
        function guid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
		}

		// Activator
        function func() {}
    }
})();