sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], (Controller, History) => {
    "use strict";

    return Controller.extend("project52.controller.Main", {
        onInit() {
            // OData 모델을 설정하고 데이터 바인딩
            const oModel = this.getOwnerComponent().getModel();
            this.getView().setModel(oModel);
        },

        onCreateBOM(oEvent) {
            // 선택된 행의 데이터를 가져옴
            const oContext = oEvent.getSource().getBindingContext();
            const matId = oContext.getProperty("mat_id");
            const matNm = oContext.getProperty("mat_nm");

            // 라우터를 사용하여 새로운 페이지로 이동
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteBOM", {
                mat_id: matId,
                mat_nm: matNm
            });
        }
    });
});