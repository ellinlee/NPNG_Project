sap.ui.define([
    "sap/ui/core/UIComponent",
    "project51/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("project51.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // ensure the 'test' model is present
            let oModel = this.getModel("test");
            if (!oModel) {
                oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDCC_TEST_RESULT_CDS/");
                this.setModel(oModel, "test");
            }

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
        }
    });
});
