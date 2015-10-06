(function() {
    'use strict';
    angular
        .module('wampChatClient')
        .controller('ChatController', ChatController);
    ChatController.$inject = ['$wamp', '$rootScope', '$state', '$stateParams', '$log', '$mdToast', '$mdDialog'];
    /* @ngInject */
    function ChatController($wamp, $rootScope, $state, $stateParams, $log, $mdToast, $mdDialog) {
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
        function logout(ev) {
            // Appending dialog to document.body to cover sidenav in docs app
            var confirm = $mdDialog.confirm()
                .title('Would you like to logout?')
                .targetEvent(ev)
                .ok('yes')
                .cancel('no');

            $mdDialog.show(confirm).then(function() {
                  $wamp.call('com.chat.logout', [chat.user.username]).then(
                    function() {
                        $state.go('home');
                    }
                );
            });
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
            if ($state.current.name === "home.chat") {
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

                if (newParticipant.username !== chat.user.username) {
                    $mdToast.show(
                        $mdToast.simple()
                            .content(newParticipant.username + ' has logged in!')
                            .position('top right')
                            .hideDelay(3000)
                    );
                }
            }
        }

        // Callback called when some user has logged out from chat.
        // It'll notify the current user and will update participant's list.
        function particpantLoggedOut(args) {
            if ($state.current.name === "home.chat") {
                var someParticipant = {
                    username: args[0].username,
                    guid: args[0].guid
                }

                chat.participantList.forEach(function(elm, idx) {
                    if (elm.username === someParticipant.username) {
                        chat.participantList.splice(idx, 1);

                        if (chat.currentConversation.unreadMessages == someParticipant.username) {
                            chat.currentConversation = {
                                username: undefined,
                                guid: undefined,
                                messages: []
                            };
                        }

                        $mdToast.show(
                            $mdToast.simple()
                                .content(someParticipant.username + ' has logged out!')
                                .position('bottom right')
                                .hideDelay(3000)
                        );
                    }
                });
            }
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

        // This function will be called when controller has been created and will setup our chat environment.
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

            // Subscribe to logout topic. When an user has logged out, our participants' list'll be updated.
            $wamp.subscribe('com.chat.participantloggedout', particpantLoggedOut);
        }
    }
})();