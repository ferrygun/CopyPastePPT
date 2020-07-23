sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function(Controller, JSONModel, MessageToast) {
    jQuery.sap.require("Camera.lib.socketio");
    "use strict";
    var socket;

    socket = io('http://localhost:3000', { transport : ['websocket'] });
    console.log(socket);

    socket.on('req', function(data) {
        sap.m.MessageToast.show("The image is ready now");
    });


    return Controller.extend("Camera.controller.Home", {
        onInit: function() {
            this.getView().setModel(new JSONModel({
                photos: []
            }));
        },

        /////////////////////////////////////////////
        //  EVENTS
        /////////////////////////////////////////////
        onSnapshot: function(oEvent) {
            // The image is inside oEvent, on the image parameter,
            // let's grab it.
            var oModel = this.getView().getModel();
            var aPhotos = oModel.getProperty("/photos");

            console.log(oEvent.getParameter("image"));
            socket.emit('client_data', {
                'base64': oEvent.getParameter("image")
            });

            aPhotos.push({
                src: oEvent.getParameter("image")
            });
            oModel.setProperty("/photos", aPhotos);
            oModel.refresh(true);
        },

        /**
         * Stop the camera when the tab is not visible.
         * @param {object} name
         * @returns {object}
         */
        onTabSelect: function(oEvent) {
            var oTab = oEvent.getParameter("key");
            var oCamera = this.getView().byId("idCamera");
            if (oTab !== "demo") {
                oCamera.stopCamera();
            } else {
                oCamera.rerender();
            }
        }
    });
});