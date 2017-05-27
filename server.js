var express = require('express');
var app = express();
var http = require('http');
var io = require('socket.io');
var port = process.env.PORT || 3000;
var mysql = require('mysql');

var Server = {
    init : function () {
        var me = this;
        me.userCount = 0;
        me.server = http.createServer(app);
        me.socket = io.listen(me.server);
        me.db = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
            database : "extchatdb"
        });
        me.db.connect(function(err) {
            if (err) {
                console.error("Error on connecting mysql database: " + err.stack);
                return;
            }
            console.log("Mysql connection established as id: " + me.db.threadId);
        });
        me.socket.on("connection", function(client) {
            var user;

            console.log("Client " + client.client.id + " connected from " + client.handshake.address + " on " + client.handshake.time);

            client.on("login", function(data) {
                if (user) return;
                console.log("Client login", user, data);
                ++me.userCount;
                user = {username : data.username};
                var messages = [];

                var onSelectOnline = function (err, results) {
                    if (err) throw err;
                    if (!results || !results.length) {
                        user.was_online = new Date(0);
                        me.db.query("INSERT INTO users(username, was_online) VALUES(?, ?)", [data.username, new Date()], onUserInsert);
                    } else {
                        user.id = results[0].id;
                        user.was_online = results[0].was_online;
                        me.db.query("UPDATE users SET was_online = ? WHERE username = ?", [new Date(), data.username], onUserInsert);
                    }
                };

                var onUserInsert = function(err, results) {
                    if (err) throw err;
                    if (!user.id) {
                        user.id = results.insertId;
                    }
                    getLostMessages();
                };

                var getLostMessages = function() {
                    me.db.query("SELECT u.username, m.post_date, m.text FROM messages m JOIN users u ON (m.user_id = u.id) WHERE m.post_date > ? ORDER BY m.post_date", [user.was_online], onGetMessages);
                };

                var onGetMessages = function(err, results) {
                    if (err) throw err;
                    messages = [];
                    for(var i = 0; i < results.length; i++) {
                        messages.push({
                            post_date : new Date(results[i].post_date),
                            username : results[i].username,
                            message : results[i].text.toString()
                        })
                    }
                    sendToClient();
                };

                var sendToClient = function() {
                    client.emit('user_logged_in', {
                        username: user.username,
                        online: me.userCount,
                        messages : messages
                    });
                    client.broadcast.emit('user_logged_in', {
                        username: user.username,
                        online: me.userCount
                    });
                };
                me.db.query("SELECT id, was_online FROM users WHERE username = ?", [data.username], onSelectOnline);
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
                var post_date = new Date();
                me.db.query("INSERT INTO messages(user_id, post_date, text) VALUES(?,?,?)", [user.id, post_date, message], function(err, results) {
                    if (err) throw err;
                    client.broadcast.emit("new_message", {
                        username : user.username,
                        message : message,
                        post_date : post_date
                    });
                });
            });

            logoutFn = function(event) {
                return function() {
                    if (!user) return;
                    console.log("Client logout", user);
                    --me.userCount;
                    me.db.query("UPDATE users SET was_online = ? WHERE username = ?", [new Date(), user.username], function(err) {
                        if (err) throw err;
                        client.broadcast.emit(event, {
                            username: user.username,
                            online: me.userCount
                        });
                        user = null;
                    });
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