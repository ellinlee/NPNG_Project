sap.ui.define([
    "sap/ui/core/UIComponent",
    "project52/model/models",
    "sap/ui/model/odata/v2/ODataModel"
], (UIComponent, models, ODataModel) => {
    "use strict";

    return UIComponent.extend("project52.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // set the OData model
            const oODataModel = new ODataModel("/sap/opu/odata/sap/ZDCC_MAT_ID_FOR_BOM_CDS/");
            this.setModel(oODataModel);

            // enable routing
            this.getRouter().initialize();
        }
    });
});