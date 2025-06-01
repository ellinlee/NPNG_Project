// sap.ui.define([
//     "sap/ui/core/mvc/Controller",
//     "sap/ui/core/routing/History"
// ], (Controller, History) => {
//     "use strict";

//     return Controller.extend("project52.controller.Main", {
//         onInit() {
//             const oModel = this.getOwnerComponent().getModel("cds"); // CDS 모델 가져오기
//             this.getView().setModel(oModel);
//         },

//         onCreateBOM(oEvent) {
//             const oContext = oEvent.getSource().getBindingContext("cds"); // CDS 모델 컨텍스트 가져오기
//             const matId = oContext.getProperty("mat_id");
//             const matNm = oContext.getProperty("mat_nm");

//             const oRouter = this.getOwnerComponent().getRouter();
//             oRouter.navTo("RouteBOM", {
//                 mat_id: matId,
//                 mat_nm: matNm
//             });
//         }
//     });
// });

sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/core/routing/History"],
  (Controller, History) => {
    "use strict";

    return Controller.extend("project52.controller.Main", {
      onInit() {
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter
          .getRoute("RouteMain")
          .attachPatternMatched(this._onRouteMatched, this);
      },

      _onRouteMatched() {
        const oModel = this.getOwnerComponent().getModel("cds");
        oModel.refresh(true); // 서버로부터 강제 새로고침
        this.getView().setModel(oModel);
        console.log("🔁 RouteMain 재진입 - CDS 모델 다시 바인딩");
      },

      onCreateBOM(oEvent) {
        const oContext = oEvent.getSource().getBindingContext("cds");
        const matId = oContext.getProperty("mat_id");
        const matNm = oContext.getProperty("mat_nm");

        const oRouter = this.getOwnerComponent().getRouter();
        oRouter.navTo("RouteBOM", {
          mat_id: matId,
          mat_nm: matNm,
        });
      },
    });
  }
);
