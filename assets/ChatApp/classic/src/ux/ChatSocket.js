Ext.define('ChatApp.ux.ChatSocket', {
    extend: 'Ext.Component',

    config: {
        /**
         * @cfg {String}
         * Socket.IO backend hostname
         */
        host: null,
        /**
         * @cfg {Number}
         * Socket.IO backend port
         */
        port: null
    },

    /**
     * @ignore
     */
    initComponent: function () {
        var me = this;
        me.callParent(arguments);

	me.setHost('http://' + document.location.hostname);
	me.setPort(3000);

        me.socket = io(me.getHost() + ':' + me.getPort());

        me.socket.on('connect', function (data) {
            me.fireEvent('connect', me, me.socket, data);
        });
        me.socket.on('user_logged_in', function (data) {
            me.fireEvent('user_logged_in', me, me.socket, data);
        });
        me.socket.on('user_typing_start', function (data) {
            me.fireEvent('user_typing_start', me, me.socket, data);
        });
        me.socket.on('user_typing_end', function (data) {
            me.fireEvent('user_typing_end', me, me.socket, data);
        });
        me.socket.on('new_message', function (data) {
            me.fireEvent('new_message', me, me.socket, data);
        });
        me.socket.on('user_logged_out', function (data) {
            me.fireEvent('user_logged_out', me, me.socket, data);
        });
        me.socket.on('connection_close', function (data) {
            me.fireEvent('connection_close', me, me.socket, data);
        });
        me.socket.on('user_disconnected', function (data) {
            me.fireEvent('user_disconnected', me, me.socket, data);
        });
    },

    /**
     * Connect to backend
     * @return {Boolean}
     */
    connect: function () {
        var me = this;
        if (me.fireEvent('beforeconnect', me) !== false) {
            me.socket.connect();
            return true;
        }
        return false;
    },

    /**
     * Disconnect to backend
     * @return {boolean}
     */
    disconnect: function () {
        var me = this;
        if (me.fireEvent('beforedisconnect', me) !== false) {
            me.socket.disconnect();
            return true;
        }
        return false;
    },

    /**
     * Send login event
     * @param {Object} data
     * @return {Boolean}
     */
    sendLogin: function (data) {
        var me = this;
        if (me.fireEvent('beforerequest', me, 'login', data) !== false) {
            me.socket.emit('login', data);
            return true;
        }
        return false;
    },

    /**
     * Send typestart event
     * @return {Boolean}
     */
    sendTypeStart: function () {
        var me = this;
        if (me.fireEvent('beforerequest', me, 'starttype', {}) !== false) {
            me.socket.emit('starttype');
            return true;
        }
        return false;
    },

    /**
     * Send typeend event
     * @return {Boolean}
     */
    sendTypeEnd: function () {
        var me = this;
        if (me.fireEvent('beforerequest', me, 'endtype', {}) !== false) {
            me.socket.emit('endtype');
            return true;
        }
        return false;
    },

    /**
     * Send chat_message event
     * @param {String} message Message
     * @return {Boolean}
     */
    sendMessage: function (message) {
        var me = this;
        if (me.fireEvent('beforerequest', me, 'chat_message', message) !== false) {
            me.socket.emit('chat_message', message);
            return true;
        }
        return false;
    },

    /**
     * Send logout event
     * @return {Boolean}
     */
    sendLogout: function () {
        var me = this;
        if (me.fireEvent('beforerequest', me, 'logout', {}) !== false) {
            me.socket.emit('logout');
            return true;
        }
        return false;
    }
});
