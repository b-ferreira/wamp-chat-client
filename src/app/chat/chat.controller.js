(function() {
    'use strict';
    angular
        .module('wampChatClient')
        .controller('ChatController', ChatController);
    ChatController.$inject = ['$wamp', '$scope', '$state', '$stateParams', '$log', '$mdToast', '$mdDialog', '$window'];
    /* @ngInject */
    function ChatController($wamp, $scope, $state, $stateParams, $log, $mdToast, $mdDialog, $window) {
        var chat = this;

        /*
         * VIEW BINDINGS
         */
        // Functions
        chat.logout = logout;
        chat.participantsListClick = participantsListClick;
        chat.sendMessage = sendMessage;

        // Vars
        chat.participantList = new Array();
        chat.currentConversation = {
            username: undefined,
            guid: undefined,
            messages: []
        };

        /*
         * Event Handlers
         */
         // Perform logout when user tries to leave the page.
        $scope.$on('$locationChangeStart', function(ev, to) {
            if (to.indexOf('/chat') === -1) {
                ev.preventDefault();
                askForLogout(ev);
            }
        });

        // If the user closes or reloads the page, we just call logout method on back-end.
        $window.onbeforeunload = windowCloseHandler;
        $window.onunload = windowCloseHandler;

        activate();
        ////////////////
        function windowCloseHandler(ev) {
            if ($state.current.name === "home.chat")
                $wamp.publish('com.chat.participantloggedout', [{
                    username: chat.user.username,
                    guid: chat.user.guid
                }]);
        }

        function askForLogout(ev) {
            var confirm = $mdDialog.confirm()
                .title('Would you like to logout?')
                .targetEvent(angular.isDefined(ev) ? ev : undefined)
                .ok('yes')
                .cancel('no');

            $mdDialog.show(confirm).then(function() {
                $wamp.publish('com.chat.participantloggedout', [{
                    username: chat.user.username,
                    guid: chat.user.guid
                }]);
                $state.go('home');
            });
        }

        // Logout button handler.
        function logout(ev) {
            // Appending dialog to document.body to cover sidenav in docs app
            askForLogout(ev);
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
                    if (elm.username === someParticipant.username && elm.username !== chat.user.username) {
                        chat.participantList.splice(idx, 1);

                        if (chat.currentConversation.username == someParticipant.username) {
                            chat.currentConversation = {
                                username: undefined,
                                guid: undefined,
                                messages: []
                            };
                        }

                        $mdToast.show(
                            $mdToast.simple()
                                .content(someParticipant.username + ' has logged out!')
                                .position('top right')
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

        /**
         * Callback method for "com.chat.userinfo + {{$wamp session}}" calls. It'll return current user's info.
         * @return {Object} Current user's info
         */
        function userInfoHandler() {
            if (angular.isDefined(chat.user))
                return {
                    username: chat.user.username,
                    guid: chat.user.guid
                }
            else return null;
        }

        // This function will be called when controller has been created and will setup our chat environment.
        function activate() {
            if (angular.isDefined($stateParams.user))
                chat.user = $stateParams.user;

            /**
             * Here we'll load participant's list using promise chaning over $wamp. 
             * To perform it we'll ask for user's info over $wamp.session list.
             */
            $wamp.call('wamp.session.list')
                .then(function(sessionList) {
                    if (!angular.isArray(sessionList)) 
                        sessionList = []

                    return Promise.all(
                        sessionList
                            .filter(function(session) {
                                return session !== $wamp.connection._session._id
                            })
                            .map(function(session) {
                                return $wamp.call('com.chat.userinfo.' + session)
                                    .catch(function(error) {
                                        return error.msg == 'wamp.errors.no_such_procedure'
                                            ? null
                                            : error
                                    })
                            })
                            .filter(function(uinfo) {
                                return uinfo !== null;
                            })
                    )
                })
                .then(function(participants) {
                    return participants
                        .filter(function(user) {
                            return !user.hasOwnProperty('error');
                        })
                        .map(function(user) {
                            return { 
                                username: user.username, 
                                guid: user.guid, 
                                unreadMessages: 0, 
                                messages: []
                            }
                        })
                })
                .then(function(participants) {
                    if (angular.isArray(chat.participantList)) {
                        Array.prototype.push.apply(chat.participantList, participants)
                    }
                });

            // -------------------
            // RPC Registering
            // -------------------

            // Register RPC to comunicate with current username, i.e. Browser to Browser.
            $wamp.register('com.chat.talkto.'+chat.user.guid, talkToCallback).then(function(res) {
                $log.info(res);
            }, function(error) {
                $log.info(error);
            });

            /**
             * Register RPC to provide user information over $wamp.
             */
            $wamp.register('com.chat.userinfo.'+$wamp.connection._session._id, userInfoHandler).then(function(res) {
                $log.info(res);
            }, function(error) {
                $log.info(error);
            });

            // -------------------
            // Topic Subscribing
            // -------------------            

            // Subscribe to login topic. Every time a new participant has logged in a callback will be executed.
            $wamp.subscribe('com.chat.newparticipant', newParticipantCallback);

            // Subscribe to logout topic. When an user has logged out, our participants' list'll be updated.
            $wamp.subscribe('com.chat.participantloggedout', particpantLoggedOut);
        }
    }
})();