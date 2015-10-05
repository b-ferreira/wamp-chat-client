(function() {
    'use strict';
    angular
        .module('wampChatClient')
        .controller('ChatController', ChatController);
    ChatController.$inject = ['$wamp', '$rootScope', '$state', '$stateParams', '$log', '$mdToast'];
    /* @ngInject */
    function ChatController($wamp, $rootScope, $state, $stateParams, $log, $mdToast) {
        var chat = this;

        /*
         * VIEW BINDINGS
         */
        // Functions
        chat.logout = logout;
        chat.participantsListClick = participantsListClick;
        chat.sendMessage = sendMessage;

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
            participant.unreadMessages = 0;

            chat.currentConversation = {
                username: participant.username,
                guid: participant.guid,
                messages: participant.messages
            };
        }

        // Click handler called when user clicks on send button
        // It'll send a new message to another participant according currentConversation configuration.
        function sendMessage() {
            if (angular.isDefined(chat.messageText) && chat.messageText !== "") {
                $wamp.call('com.chat.talkto.'+chat.currentConversation.guid, [chat.messageText, {username:chat.user.username, guid:chat.user.guid}]).then(
                    function(res) {
                        chat.currentConversation.messages.push({
                            from: chat.user.username,
                            time: moment().format('hh:mm:ss'),
                            message: chat.messageText
                        });
                        
                        chat.messageText = "";
                        $log.info(res);
                    }
                ).catch(function(error) {
                    $log.info(error);
                });
            }
        }

        // Callback called when another user has logged in on chat application.
        function newParticipantCallback(args) {
            var newParticipant = {
                username: args[0].username,
                guid: args[0].guid
            }

            if (chat.participantList.filter(function(elm) {
                return elm.username == newParticipant.username;
            }).length == 0) {
                chat.participantList.push({
                    username: newParticipant.username,
                    guid: newParticipant.guid,
                    unreadMessages: 0,
                    messages: []
                });
            }

            $mdToast.show(
                $mdToast.simple()
                    .content(newParticipant.username + ' has logged in!')
                    .position('top right')
                    .hideDelay(3000)
            );
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

                if (angular.isDefined(anotherParticipant)) {
                    anotherParticipant.unreadMessages++;
                    anotherParticipant.messages.push({
                        from: from.username,
                        time: moment().format('hh:mm:ss'),
                        message: message
                    });

                    $mdToast.show(
                        $mdToast.simple()
                            .content(anotherParticipant.username + ' sent a new message!')
                            .position('top right')
                            .hideDelay(3000)
                    );
                }
            }

            return "Message received!";
        }

        function activate() {
            if (angular.isDefined($stateParams.user))
                chat.user = $stateParams.user;

            // Call RPC to populate participants' list.
        	$wamp.call('com.chat.getparticipants').then(
        		function(res) {
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
        	);

            // Register RPC to comunicate with current username, i.e. Browser to Browser.
            $wamp.register('com.chat.talkto.'+chat.user.guid, talkToCallback).then(
                function(res) {
                    $log.info(res);
                },
                function(error) {
                    $log.info(error);
                }
            );

            // Subscribe to login topic. Everty time a new participant has logged in a callback will be executed.
            $wamp.subscribe('com.chat.newparticipant', newParticipantCallback);
        }
    }
})();