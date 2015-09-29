(function() {
    'use strict';
    angular
        .module('wampChatClient')
        .controller('ChatController', ChatController);
    ChatController.$inject = ['$wamp', '$rootScope', '$state', '$stateParams'];
    /* @ngInject */
    function ChatController($wamp, $rootScope, $state, $stateParams) {
        var chat = this;

        /*
         * VIEW BINDINGS
         */
        // Functions
        chat.logout = logout;
        chat.participantsListClick = participantsListClick;

        // Vars
        chat.participantList = [];        
        chat.currentConversation = {
            username: undefined,
            guid: undefined,
            messages: []
        };

        activate();
        ////////////////
        // Logout button handler.
        function logout() {
            $wamp.call('com.chat.logout', [chat.user.username]).then(
                function(res) {
                    $state.go('home.login');
                }
            );
        }

        // Click handler called when user clicks on items from participants' list.
        // It'll setupt currentConversation with clicked item's info and load all messages sent previously.
        function participantsListClick(participant) {
            chat.messageText = "";

            chat.currentConversation = {
                username: participant.username,
                guid: participant.guid,
                messages: participant.messages
            };
        }

        // Callback for RPC method 'com.chat.talkto', this function will notify the users that another user
        // intented to start a conversation.
        // args = {
        //  0: message,
        //  1: from == user { username, guid };
        // }
        function talkToCallback(args) {
            var message = args[0];
            var from = args[1];

            // First of all, check if this new message belongs to current conversation.
            // If not, search for user who sents the message in participants' list and increase the unread message count.
            if (from.username == chat.currentConversation.username) {
                chat.currentConversation.messages.push({
                    from: from.username,
                    time: moment().format('hh:mm:ss'),
                    message: message
                });
            } else {
                var anotherParticipant = chat.participantList.filter(function(elm) {
                    return elm.username == from.username;
                })[0];

                anotherParticipant.unreadMessages++;
                anotherParticipant.messages.push({
                    from: from.username,
                    time: moment().format('hh:mm:ss'),
                    message: message
                });
            }
        }

        function activate() {
            if (!angular.isUndefined($stateParams.user))
                chat.user = $stateParams.user;

            // Call RPC to populate participants' list.
        	$wamp.call('com.chat.getparticipants').then(
        		function(res) {
                    if (angular.isArray(res)) {
                        chat.participantList =  res.filter(function(elm) {
                           return elm.username !== chat.user.username; 
                        }).map(function(elm) {
                            return {
                                username: elm.username,
                                guid: elm.guid,
                                unreadMessages: 0,
                                messages: []
                            }
                        });
                    }
        		}
        	);

            // Register RPC to comunicate with current username, i.e. Browser to Browser.
            $wamp.register('com.chat.talkto.'+chat.user.guid, talkToCallback);
        }
    }
})();