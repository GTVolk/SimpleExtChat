/**
 * This class is the controller for the main view for the application. It is specified as
 * the "controller" of the Main view class.
 *
 * TODO - Replace this content of this view to suite the needs of your application.
 */
Ext.define('ChatApp.view.main.MainController', {
    extend: 'Ext.app.ViewController',

    alias: 'controller.main',

    routes : {
        'main' : 'onMain'
    },
    
    onMain : function() {
        var chatWnd = Ext.create("ChatApp.view.window.ChatWindow", {
            title : "Live ExtJS Chat App",
            constrainHeader : true,
            closable : false,
            modal : true,
            width : Ext.getBody().getViewSize().width * 0.3,
            height : Ext.getBody().getViewSize().height * 0.9
        });
        chatWnd.show();
    }
});
