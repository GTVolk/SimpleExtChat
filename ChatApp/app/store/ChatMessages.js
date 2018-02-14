Ext.define('ChatApp.store.ChatMessages', {
    extend: 'Ext.data.Store',
    alias: 'store.chatmessages',

    requires: [
        'ChatApp.model.ChatMessage'
    ],

    model: 'ChatApp.model.ChatMessage',

    storeId: 'chatmessagesstore',

    proxy: {
        type: 'localstorage',
        id: 'SimpleExtChat'
    },
    autoLoad: true
});
