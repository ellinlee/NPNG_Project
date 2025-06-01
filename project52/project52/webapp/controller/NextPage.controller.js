sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel"],
  (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("project52.controller.NextPage", {
      onInit() {
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter
          .getRoute("RouteNextPage")
          .attachPatternMatched(this._onRouteMatched, this);
      },

      _onRouteMatched(oEvent) {
        // 라우팅 파라미터 가져오기
        const oArgs = oEvent.getParameter("arguments");

        // 전달된 데이터를 JSON으로 파싱
        try {
          const oData = {
            headerMat: JSON.parse(oArgs.headerMat),
            rawMaterials: JSON.parse(oArgs.rawMaterials),
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
          mat_nm: sMatNm,
        });
      },

      onSave() {
        const oModel = this.getOwnerComponent().getModel("bom");
        const oLocalModel = this.getView().getModel();

        const oHeaderData = oLocalModel.getProperty("/headerMat");
        const aRawMaterials = oLocalModel.getProperty("/rawMaterials");

        oModel.setUseBatch(false); // 배치 전송 비활성화

        // 1. 여러 개 BomId 가져와서 클라이언트 정렬
        oModel.read("/zdct_pp010Set", {
          urlParameters: {
            $top: 1000, // 충분히 넉넉하게 조회
          },
          success: (oData) => {
            const aResults = oData.results || [];

            // 숫자 기준 정렬
            aResults.sort(
              (a, b) => parseInt(b.BomId, 10) - parseInt(a.BomId, 10)
            );

            const lastBomId = aResults[0]?.BomId || "100000";
            const nextBomNum = parseInt(lastBomId, 10) + 1;

            if (nextBomNum > 999999) {
              sap.m.MessageBox.error("BOM ID 최대값을 초과했습니다.");
              return;
            }

            const newBomId = nextBomNum.toString().padStart(6, "0");

            // 🔍 콘솔 로그
            console.log("📦 마지막 BomId:", lastBomId);
            console.log("🚀 새로 생성된 BomId:", newBomId);

            // 2. 헤더 저장
            const oPP010Data = {
              BomId: newBomId,
              MatId: oHeaderData.matId,
              MatNm: oHeaderData.matNm,
              Qty: "1",
              Uom: "EA",
              BomVersion: "1",
              DeleteFlag: false,
            };

            oModel.create("/zdct_pp010Set", oPP010Data, {
              success: () => {
                console.log("✅ 헤더 저장 성공:", newBomId);

                // 3. 구성 저장
                let iBomItem = 10;
                aRawMaterials.forEach((oMaterial) => {
                  const oPP011Item = {
                    BomId: newBomId,
                    BomItem: iBomItem.toString().padStart(6, "0"),
                    MatId: oMaterial.matId,
                    BomLevel: oMaterial.bomLevel,
                    MatNm: oMaterial.matNm,
                    Qty: oMaterial.quantity,
                    Uom: oMaterial.uom,
                    DeleteFlag: false,
                  };
                  iBomItem += 10;

                  oModel.create("/zdct_pp011Set", oPP011Item, {
                    success: () => {
                      console.log("✅ 구성 저장 성공:", oPP011Item.MatId);
                    },
                    error: (err) => {
                      console.error(
                        "❌ 구성 저장 실패:",
                        oPP011Item.MatId,
                        err
                      );
                      sap.m.MessageBox.error(
                        `자재 ${oPP011Item.MatId} 저장 실패`
                      );
                    },
                  });
                });

                sap.m.MessageToast.show("BOM 생성 완료");
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteMain", {}, true);
              },
              error: (err) => {
                console.error("❌ 헤더 저장 실패", err);
                sap.m.MessageBox.error("헤더 저장 중 오류가 발생했습니다.");
              },
            });
          },
          error: (err) => {
            console.error("❌ BomId 조회 실패", err);
            sap.m.MessageBox.error("BomId 생성 실패: 기존 ID 조회 중 오류");
          },
        });
      },
    });
  }
);
