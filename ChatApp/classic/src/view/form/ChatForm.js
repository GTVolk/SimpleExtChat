/**
 * Created by Max on 20.05.2017.
 */

Ext.define("ChatApp.view.form.ChatForm", {
    extend : "Ext.form.Panel",
    alias : "widget.chatform",

    requires : [
        "Ext.grid.Panel",
        "Ext.panel.Panel",
        "Ext.window.Window",
        "Ext.window.Toast",
        "Ext.util.Format",
        "Ext.form.field.TextArea",
        "ChatApp.ux.ChatSocket"
    ],

    /**
     * @ignore
     * Layout
     */
    layout : "border",

    config : {
        /**
         * @cfg {String}
         * Username to login
         */
        username: ""
    },

    /**
     * @ignore
     */
    initComponent : function() {
        var me = this;
        me.items = [me.createChatBox(), me.createMessageBox()];

        me.callParent(arguments);

        me.username = sessionStorage.getItem("chat-username");
        me.socket = Ext.create("ChatApp.ux.ChatSocket");

        me.socket.on("connect", me.onSocketConnect, me);
        me.socket.on("user_logged_in", me.onSocketLogin, me);
        me.socket.on("user_type_start", me.onSocketTypeStart, me);
        me.socket.on("user_type_end", me.onSocketTypeEnd, me);
        me.socket.on("new_message", me.onSocketMessage, me);
        me.socket.on("user_logged_out", me.onSocketLogout, me);
        me.socket.on("connection_close", me.onSocketClose, me);
        me.socket.on("user_disconnected", me.onSocketDisconnect, me);

        // Set scroll to last message
        me.chatBox.on("afterrender", function() {
            var record = me.chatBox.getStore().last();
            me.goToRecord(record);
        });
        // Because on focusing text area executes layout change and scroll falls back to grid top
        me.messageBox.down("textarea").on("focus", function() {
            var record = me.chatBox.getStore().last();
            me.goToRecord(record);
        });
    },

    /**
     * Shows login window
     *
     * @return {Ext.window.Window} Login window object
     */
    showLoginForm : function() {
        var me = this;
        me.loginWnd = Ext.create("Ext.window.Window", {
            title : "Login in",
            layout : "fit",
            modal : true,
            width : 230,
            height : 100,
            closable : false,
            constrainHeader : true,
            items : [{
                itemId : "mainForm",
                padding : 10,
                xtype : "form",
                defaults: {
                    xtype : "textfield",
                    width : 200,
                    maxLength : 16,
                    minLength : 3,
                    listeners : {
                        scope : me,
                        specialkey : function(textfield, event) {
                            if(event.getKey() === event.ENTER) {
                                var form = textfield.up("#mainForm");
                                if(form.getForm().isValid()){
                                    var values = form.getForm().getValues();

                                    me.username = values.username;
                                    sessionStorage.setItem("chat-username", me.username);
                                    me.socket.sendLogin({username: me.username});

                                    me.loginWnd.close();
                                    me.loginWnd.destroy();

                                    me.updateLayout();
                                    me.chatBox.getView().refresh();

                                    var record = me.chatBox.getStore().last();
                                    me.goToRecord(record);
                                }
                            }
                        }
                    }
                },
                items	: [{
                    fieldLabel : "Username" ,
                    name : "username",
                    allowBlank : false
                }]
            }]
        });
        me.loginWnd.show();
        return me.loginWnd;
    },

    /**
     *
     * @param {ChatApp.ux.ChatSocket} chatsocket Chat socket class
     * @param {io} socket Socket.IO class
     * @param {Object} data Event data from Socket.IO
     */
    onSocketConnect : function(chatsocket, socket, data) {
        var me = this;
        //console.log("connect");
        Ext.toast("Server connection estableshed");
        if (!me.username) {
            me.showLoginForm();
        } else {
            me.socket.sendLogin({username: me.username});
        }
    },

    /**
     *
     * @param {ChatApp.ux.ChatSocket} chatsocket Chat socket class
     * @param {io} socket Socket.IO class
     * @param {Object} data Event data from Socket.IO
     */
    onSocketLogin : function(chatsocket, socket, data) {
        var me = this;
        //console.log("user_logged_in", data);
        var username = Ext.util.Format.stripTags(data.username);
        var myUsername = Ext.util.Format.stripTags(me.username);
        if (myUsername === username) {
            this.messageBox.down("textarea").setDisabled(false);
            Ext.toast("Welcome, " + username + ". " + data.online + " users is now online");
        } else {
            Ext.toast("User " + username + " logged in. " + data.online + " users is now online");
        }
    },

    /**
     *
     * @param {ChatApp.ux.ChatSocket} chatsocket Chat socket class
     * @param {io} socket Socket.IO class
     * @param {Object} data Event data from Socket.IO
     */
    onSocketTypeStart : function(chatsocket, socket, data) {
        var me = this;
        //console.log("user_type_start", data);
        var username = Ext.util.Format.stripTags(data.username);
        Ext.toast("User " + username + " typing message");
    },

    /**
     *
     * @param {ChatApp.ux.ChatSocket} chatsocket Chat socket class
     * @param {io} socket Socket.IO class
     * @param {Object} data Event data from Socket.IO
     */
    onSocketTypeEnd : function(chatsocket, socket, data) {
        var me = this;
        //console.log("user_type_end", data);
        var username = Ext.util.Format.stripTags(data.username);
        Ext.toast("User " + username + " ends typing message");
    },

    /**
     *
     * @param {ChatApp.ux.ChatSocket} chatsocket Chat socket class
     * @param {io} socket Socket.IO class
     * @param {Object} data Event data from Socket.IO
     */
    onSocketMessage : function(chatsocket, socket, data) {
        var me = this;
        //console.log("new_message", data);
        me.addMessage(data.username, data.message);
    },

    /**
     *
     * @param {ChatApp.ux.ChatSocket} chatsocket Chat socket class
     * @param {io} socket Socket.IO class
     * @param {Object} data Event data from Socket.IO
     */
    onSocketLogout : function(chatsocket, socket, data) {
        var me = this;
        //console.log("user_logged_out", data);
        var username = Ext.util.Format.stripTags(data.username);
        Ext.toast("User " + username + " logged out. " + data.online + " users is still online");
    },

    /**
     *
     * @param {ChatApp.ux.ChatSocket} chatsocket Chat socket class
     * @param {io} socket Socket.IO class
     */
    onSocketClose : function(chatsocket, socket) {
        var me = this;
        //console.log("connection_close", data);
        Ext.toast("Connection closed");
    },

    /**
     * Process socket disconnect event
     * @param {ChatApp.ux.ChatSocket} chatsocket Chat socket class
     * @param {io} socket Socket.IO class
     * @param {Object} data Event data from Socket.IO
     */
    onSocketDisconnect : function(chatsocket, socket, data) {
        var me = this;
        //console.log("user_disconnected", data);
        var username = Ext.util.Format.stripTags(data.username);
        Ext.toast("User " + username + " disconnected. " + data.online + " users is still online");
    },

    /**
     * @ignore
     */
    privates : {
        /**
         * Create chat box
         *
         * @return {Ext.grid.Panel}
         */
        createChatBox : function() {
            var me = this;
            if (!me.chatBox) {
                this.chatBox = Ext.create("Ext.grid.Panel", {
                    region : "center",
                    padding	: 5,
                    reserveScrollbar : true,
                    scrollable : true,
                    columnLines : false,
                    rowLines : false,
                    disableSelection: true,
                    viewConfig : {
                        stripeRows: false,
                        trackOver : false,
                        preserveScrollOnRefresh : true
                    },
                    store : "chatmessagesstore",
                    hideHeaders : true,
                    columns : [{
                        flex : 1,
                        dataIndex : "message",
                        renderer : function(value, metaData, record) {
                            var username = Ext.util.Format.stripTags(record.get("username"));
                            var message = Ext.util.Format.stripTags(record.get("message"));
                            return '<div class="chat-message chat-message-' + (me.username === username ? "left" : "right") + '"><div class="chat-user">' + username + '</div><div class="chat-text">' + message + '</div></div><div class="chat-message-clear"></div>';
                        }
                    }]
                });
            }
            return me.chatBox;
        },

        /**
         * Create message panel
         *
         * @return {Ext.panel.Panel} Message panel
         */
        createMessageBox : function() {
            if (!this.messageBox) {
                this.messageBox = Ext.create("Ext.panel.Panel", {
                    region : "south",
                    layout : "fit",
                    padding : 5,
                    items : [{
                        xtype : "textarea",
                        growMax : 300,
                        growMin : 20,
                        minHeight : 20,
                        disabled : true,
                        maxRows : 1,
                        grow : true,
                        enableKeyEvents : true,
                        emptyText : "Enter message...",
                        listeners : {
                            scope : this,
                            keydown : 'onMessageSend'
                        }
                    }]
                });
            }
            return this.messageBox;
        },

        /**
         * Scroll to needed message
         *
         * @param {ChatApp.model.ChatMessage} record Message record
         */
        goToRecord : function(record) {
            var me = this;
            if (record) {
                // Timeout to make sure all render events is processed
                setTimeout(function() {
                    var rowEl = me.chatBox.getView().getRow(record);
                    var gridEl = me.chatBox.getEl();
                    rowEl.scrollIntoView(gridEl, false);
                }, 10);
            }
        },

        /**
         * Append message to chatbox and save to localStorage
         *
         * @param {String} username Message author
         * @param {String} message Message
         */
        addMessage : function(username, message) {
            if (this.chatBox) {
                var record = this.chatBox.getStore().add({username : username, message : message});
                this.goToRecord(record[0]);
                this.chatBox.getStore().sync();
            }
        },

        /**
         * On text area enter hit send message throught this method
         *
         * @param {Ext.form.field.TextArea} textarea Text area object
         * @param {Ext.event.Event} event Key event
         */
        onMessageSend : function(textarea, event) {
            var me = this;
            if(event.getKey() === event.ENTER) {
                if (!event.ctrlKey) {
                    event.preventDefault();
                    var message = textarea.getValue();
                    if (message) {
                        if (me.socket.sendMessage(message)) {
                            me.addMessage(me.username, message);
                            textarea.setValue("");
                        }
                    }
                } else {
                    textarea.setValue(textarea.getValue() + "\n\r");
                }
            }
        }
    }
});