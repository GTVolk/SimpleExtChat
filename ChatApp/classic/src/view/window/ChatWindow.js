/**
 * Created by Max on 20.05.2017.
 */

Ext.define("ChatApp.view.window.ChatWindow", {
    extend : "Ext.window.Window",
    alias : "widget.chatwindow",

    requires : [
        'ChatApp.view.form.ChatForm'
    ],

    layout : "fit",

    items : [{
        xtype : "chatform"
    }]
});