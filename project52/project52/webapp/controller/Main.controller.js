sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], (Controller, History) => {
    "use strict";

    return Controller.extend("project52.controller.Main", {
        onInit() {
            const oModel = this.getOwnerComponent().getModel("cds"); // CDS 모델 가져오기
            this.getView().setModel(oModel);
        },

        onCreateBOM(oEvent) {
            const oContext = oEvent.getSource().getBindingContext("cds"); // CDS 모델 컨텍스트 가져오기
            const matId = oContext.getProperty("mat_id");
            const matNm = oContext.getProperty("mat_nm");

            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteBOM", {
                mat_id: matId,
                mat_nm: matNm
            });
        }
    });
});