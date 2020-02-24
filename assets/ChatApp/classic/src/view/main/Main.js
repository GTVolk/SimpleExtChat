Ext.define('ChatApp.view.main.Main', {
    extend: 'Ext.Viewport',
    xtype: 'app-main',

    requires: [
        'ChatApp.view.main.MainController',
        'ChatApp.view.main.MainModel',

        'ChatApp.view.window.ChatWindow'
    ],

    controller: 'main',
    viewModel: 'main',

    layout: 'fit'
});
