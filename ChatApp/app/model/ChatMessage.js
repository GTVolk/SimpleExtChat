/**
 * Created by Max on 20.05.2017.
 */

Ext.define("ChatApp.model.ChatMessage", {
    extend : "Ext.data.Model",
    idProperty : "id",
    fields : [{
        name : "id",
        type : "auto"
    }, {
        name : "post_date",
        type : "date"
    }, {
        name : "username",
        type : "string"
    }, {
        name : "message",
        type : "string"
    }]
});