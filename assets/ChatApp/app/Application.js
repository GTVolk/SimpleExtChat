Ext.define('ChatApp.Application', {
    extend: 'Ext.app.Application',

    name: 'ChatApp',

    stores: [
        'ChatApp.store.ChatMessages'
    ],

    defaultToken: 'main',

    onAppUpdate: function () {
        Ext.Msg.confirm('Application Update', 'This application has an update, reload?',
            function (choice) {
                if (choice === 'yes') {
                    window.location.reload();
                }
            }
        );
    }
});
