sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/HBox",
    "sap/m/Input",
    "sap/m/Text",
    "sap/m/Button",
    "sap/m/Select",
    "sap/ui/core/Item",
  ],
  (Controller, HBox, Input, Text, Button, Select, Item) => {
    "use strict";

    return Controller.extend("project52.controller.BOM", {
      onInit() {
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter
          .getRoute("RouteBOM")
          .attachPatternMatched(this._onRouteMatched, this);
      },

      _onRouteMatched(oEvent) {
        const oArgs = oEvent.getParameter("arguments");
        this.headerMat = {
          matId: oArgs.mat_id,
          matNm: oArgs.mat_nm,
        };

        // 헤더 데이터를 화면에 표시
        const oVBox = this.byId("bomContainer");

        // 기존 텍스트 컨트롤이 있는지 확인하고 제거
        const aItems = oVBox.getItems();
        if (
          aItems.length > 0 &&
          aItems[0].isA("sap.m.Text") &&
          aItems[1].isA("sap.m.Text")
        ) {
          oVBox.removeItem(aItems[0]);
          oVBox.removeItem(aItems[1]);
        }

        // 새로운 텍스트 컨트롤 추가
        oVBox.insertItem(
          new Text({ text: `원자재 ID: ${this.headerMat.matId}` }),
          0
        );
        oVBox.insertItem(
          new Text({ text: `원자재 이름: ${this.headerMat.matNm}` }),
          1
        );
      },

      onBack() {
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter.navTo("RouteMain"); // 메인 라우트로 돌아감
      },

      onAddBOMItem() {
        // 새로운 입력 필드 세트 생성
        const oHBox = new HBox({
          items: [
            new Select({
              width: "150px",
              items: [
                new Item({ key: "", text: "" }), // 빈 값 추가
                new Item({ key: "0", text: "0" }),
                new Item({ key: "1", text: "1" }),
                new Item({ key: "2", text: "2" }),
              ],
            }),
            new Input({
              placeholder: "원자재 ID",
              width: "150px",
              editable: false, // 입력 불가능한 칸으로 설정
              showValueHelp: true, // 서치 헬프 활성화
              valueHelpRequest: (oEvent) => this.onValueHelpRequest(oEvent), // 서치 헬프 이벤트 핸들러
            }),
            new Input({
              placeholder: "원자재 이름",
              width: "150px",
              editable: false, // 입력 불가능한 칸으로 설정
            }),
            new Input({ placeholder: "Quantity", width: "150px" }),
            new Select({
              width: "150px",
              items: [
                new Item({ key: "", text: "" }), // 빈 값 추가
                new Item({ key: "KG", text: "KG" }),
                new Item({ key: "LTR", text: "LTR" }),
                new Item({ key: "EA", text: "EA" }),
              ],
            }),
            new Button({
              text: "삭제",
              press: (oEvent) => this.onDeleteBOMItem(oEvent),
            }),
          ],
        });

        // 입력 필드 세트를 컨테이너에 추가
        const oVBox = this.byId("bomContainer");
        oVBox.addItem(oHBox);
      },

      onDeleteBOMItem(oEvent) {
        // 삭제 버튼이 포함된 HBox를 삭제
        const oButton = oEvent.getSource();
        const oHBox = oButton.getParent();
        const oVBox = this.byId("bomContainer");
        oVBox.removeItem(oHBox);
      },

      onNext() {
        const oVBox = this.byId("bomContainer");
        const aItems = oVBox.getItems();
        const aRawMaterials = [];
        let bValid = true; // 모든 입력값이 유효한지 확인하는 플래그

        // 원자재 데이터를 수집
        aItems.forEach((oItem) => {
          if (oItem.isA("sap.m.HBox")) {
            const aInputs = oItem.getItems();
            const sBOMLevel = aInputs[0].getSelectedKey(); // 드롭다운에서 선택된 BOM Level
            const sMatId = aInputs[1].getValue(); // Material ID
            const sMatNm = aInputs[2].getValue(); // Material Name
            const sQuantity = aInputs[3].getValue(); // Quantity
            const sUOM = aInputs[4].getSelectedKey(); // 드롭다운에서 선택된 UOM

            // 필드 검증
            if (!sBOMLevel || !sMatId || !sMatNm || !sQuantity || !sUOM) {
              bValid = false;
            }

            // BOM 데이터를 배열에 추가
            aRawMaterials.push({
              bomLevel: sBOMLevel,
              matId: sMatId,
              matNm: sMatNm,
              quantity: sQuantity,
              uom: sUOM,
            });
          }
        });

        // 모든 필드가 유효하지 않으면 메시지 표시
        if (!bValid) {
          sap.m.MessageToast.show("모든 필드를 입력하세요.");
          return;
        }

        console.log("Header Material:", this.headerMat);
        console.log("Raw Materials:", aRawMaterials);

        // 라우터를 사용하여 새로운 페이지로 이동
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter.navTo("RouteNextPage", {
          headerMat: JSON.stringify(this.headerMat), // 헤더 완제품 데이터
          rawMaterials: JSON.stringify(aRawMaterials), // 원자재 데이터
        });
      },

      onValueHelpRequest(oEvent) {
        const oInput = oEvent.getSource();
        const oModel = this.getOwnerComponent().getModel("bom");

        oModel.read("/zdct_mm010Set", {
          success: (oData) => {
            const aItems = oData.results;

            const oJSONModel = new sap.ui.model.json.JSONModel();
            oJSONModel.setData({ results: aItems });

            const oDialog = new sap.m.SelectDialog({
              title: "Material Search",
              items: {
                path: "/results",
                template: new sap.m.StandardListItem({
                  title: "{MatId}",
                  description: "{MatNm}",
                }),
              },

              // ✅ 검색 핸들러 추가
              search: function (oEvent) {
                const sValue = oEvent.getParameter("value");
                const oFilter = new sap.ui.model.Filter({
                  filters: [
                    new sap.ui.model.Filter(
                      "MatId",
                      sap.ui.model.FilterOperator.Contains,
                      sValue
                    ),
                    new sap.ui.model.Filter(
                      "MatNm",
                      sap.ui.model.FilterOperator.Contains,
                      sValue
                    ),
                  ],
                  and: false, // OR 조건
                });
                oEvent.getSource().getBinding("items").filter([oFilter]);
              },

              confirm: (oConfirmEvent) => {
                const oSelectedItem =
                  oConfirmEvent.getParameter("selectedItem");
                if (oSelectedItem) {
                  oInput.setValue(oSelectedItem.getTitle());
                  const oHBox = oInput.getParent();
                  const oMatNmInput = oHBox.getItems()[2];
                  oMatNmInput.setValue(oSelectedItem.getDescription());
                }
              },

              cancel: () => oDialog.close(),
            });

            oDialog.setModel(oJSONModel);
            this.getView().addDependent(oDialog);
            oDialog.open();
          },
          error: (oError) => {
            sap.m.MessageToast.show("데이터를 가져오는 데 실패했습니다.");
            console.error("Error fetching data:", oError);
          },
        });
      },
    });
  }
);
