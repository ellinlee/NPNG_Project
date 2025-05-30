sap.ui.define([
    "sap/ui/core/UIComponent",
    "project52/model/models",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/json/JSONModel"
], (UIComponent, models, ODataModel, JSONModel) => {
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

            // set the CDS view OData model for Main
            const oCDSModel = new ODataModel("/sap/opu/odata/sap/ZDCC_MAT_ID_FOR_BOM_CDS/");
            this.setModel(oCDSModel, "cds");

            // set the zdct_mm010Set OData model for BOM
            const oBOMModel = new ODataModel("/sap/opu/odata/sap/ZDCPP_GW_002_SRV/");
            this.setModel(oBOMModel, "bom");

            // enable routing
            this.getRouter().initialize();
        }
    });
});