sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("project52.controller.NextPage", {
        onInit() {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteNextPage").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched(oEvent) {
            // 라우팅 파라미터 가져오기
            const oArgs = oEvent.getParameter("arguments");

            // 전달된 데이터를 JSON으로 파싱
            try {
                const oData = {
                    headerMat: JSON.parse(oArgs.headerMat),
                    rawMaterials: JSON.parse(oArgs.rawMaterials)
                };

                // 로컬 JSON 모델 설정
                const oLocalModel = new JSONModel(oData);
                this.getView().setModel(oLocalModel);
            } catch (e) {
                console.error("Error parsing routing parameters:", e);
            }
        },

        onBack() {
            // 헤더 데이터에서 mat_id 가져오기
            const oModel = this.getView().getModel();
            const sMatId = oModel.getProperty("/headerMat/matId");
            const sMatNm = oModel.getProperty("/headerMat/matNm");

            // 이전 페이지로 이동하면서 mat_id 전달
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteBOM", {
                mat_id: sMatId,
                mat_nm: sMatNm
            });
        },

        onSave() {
            const oModel = this.getOwnerComponent().getModel("bom"); // BOM 모델 가져오기
            const oLocalModel = this.getView().getModel(); // 로컬 JSON 모델 가져오기

            // 헤더 데이터 가져오기
            const oHeaderData = oLocalModel.getProperty("/headerMat");

            // 원자재 데이터 가져오기
            const aRawMaterials = oLocalModel.getProperty("/rawMaterials");

            // 배치 요청 시작
            oModel.setDeferredGroups(["batchGroup1"]); // 배치 그룹 설정

            // 변경 세트 생성
            const mParameters = {
                groupId: "batchGroup1",
                changeSetId: "changeSet1"
            };

            // 헤더 데이터 추가
            const oPP010Data = {
                BomId: oHeaderData.BomId, // 헤더의 BomId 사용
                MatId: oHeaderData.matId,
                MatNm: oHeaderData.matNm,
                Qty: "1", // 하드코딩된 값
                Uom: "EA", // 하드코딩된 값
                BomVersion: "1", // 하드코딩된 값
                DeleteFlag: false // 하드코딩된 값
            };
            oModel.create("/zdct_pp010Set", oPP010Data, mParameters);

            // PP011 데이터 생성 및 추가
            let iBomItem = 10; // BomItem 초기값 설정
            aRawMaterials.forEach((oMaterial) => {
                const oPP011Item = {
                    BomId: oHeaderData.BomId, // 헤더의 BomId 사용
                    BomItem: iBomItem.toString().padStart(6, "0"), // BomItem 생성
                    MatId: oMaterial.matId,
                    BomLevel: oMaterial.bomLevel,
                    MatNm: oMaterial.matNm,
                    Qty: oMaterial.quantity,
                    Uom: oMaterial.uom,
                    DeleteFlag: false // 하드코딩된 값
                };
                iBomItem += 10; // BomItem 증가
                oModel.create("/zdct_pp011Set", oPP011Item, mParameters);
            });

            // 배치 요청 실행
            oModel.submitChanges({
                groupId: "batchGroup1",
                success: (oData) => {
                    console.log("Batch request successfully submitted:", oData);
                },
                error: (oError) => {
                    console.error("Error submitting batch request:", oError);
                }
            });
        }
    });
});