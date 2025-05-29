sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/HBox",
    "sap/m/Input"
], (Controller, HBox, Input) => {
    "use strict";

    return Controller.extend("project52.controller.BOM", {
        onInit() {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteBOM").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched(oEvent) {
            const oArgs = oEvent.getParameter("arguments");
            console.log("Routing arguments:", oArgs); // 디버깅용 로그

            // 바인딩 경로 설정
            const sPath = `/zdcc_mat_id_for_bom('${oArgs.mat_id}')`;
            console.log("Binding path:", sPath); // 디버깅용 로그

            this.getView().bindElement({
                path: sPath,
                model: undefined // 기본 모델 사용
            });
        },

        onAddBOMItem() {
            // 새로운 입력 필드 세트 생성
            const oHBox = new HBox({
                items: [
                    new Input({ placeholder: "BOM Level", width: "150px" }),
                    new Input({ placeholder: "Material ID", width: "150px" }),
                    new Input({ placeholder: "Material Name", width: "150px" }),
                    new Input({ placeholder: "Quantity", width: "150px" }),
                    new Input({ placeholder: "Unit of Measure", width: "150px" })
                ]
            });

            // 입력 필드 세트를 컨테이너에 추가
            const oVBox = this.byId("bomContainer");
            oVBox.addItem(oHBox);
        }
    });
});