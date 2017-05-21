var express = require('express');
var app = express();
var http = require('http');
var io = require('socket.io');
var port = process.env.PORT || 3000;

var Server = {
    init : function () {
        var me = this;
        me.userCount = 0;
        me.server = http.createServer(app);
        me.socket = io.listen(me.server);
        me.socket.on("connection", function(client) {
            var user;

            console.log("Client connected", client);

            client.on("login", function(data) {
                if (user) return;
                console.log("Client login", user, data);
                ++me.userCount;
                user = {username : data.username};
                client.emit('user_logged_in', {
                    username: user.username,
                    online: me.userCount
                });
                client.broadcast.emit('user_logged_in', {
                    username: user.username,
                    online: me.userCount
                });
            });

            client.on("starttype", function() {
                if (!user) return;
                console.log("Client typing", user);
                client.broadcast.emit('user_typing_start', {
                    username: user.username
                });
            });

            client.on("endtype", function() {
                if (!user) return;
                console.log("Client ends typing", user);
                client.broadcast.emit("user_typing_end", {
                    username : user.username
                });
            });

            client.on("chat_message", function(message) {
                if (!user) return;
                console.log("Client sended message", user, message);
                client.broadcast.emit("new_message", {
                    username : user.username,
                    message : message
                })
            });

            logoutFn = function(event) {
                return function() {
                    if (!user) return;
                    console.log("Client logout", user);
                    --me.userCount;
                    client.broadcast.emit(event, {
                        username: user.username,
                        online: me.userCount
                    });
                    user = null;
                }
            };

            client.on("logout", logoutFn("user_logged_out"));
            client.on("close", logoutFn("connection_close"));
            client.on("disconnect", logoutFn("user_disconnected"));
        });
    },

    connect : function (port) {
        var me = this;
        me.server.listen(port);
        console.log("Server listening at port %d", port);
    }
};

Server.init();
Server.connect(port);