sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel", // ODataModel 모듈 추가
    "sap/m/MessageToast",
    "sap/m/MessageBox",
  ],
  (Controller, ODataModel, MessageToast, MessageBox) => {
    "use strict";

    return Controller.extend("sync.dc.mm.project31.controller.Main", {
      onInit() {
        // 다크모드 적용
        // sap.ui.getCore().applyTheme("sap_fiori_3_dark");

        // OData 모델 생성 및 설정
        var oModel = new ODataModel("/sap/opu/odata/sap/ZDCMM_GW_001_SRV/", {
          useBatch: false, // 옵션 추가
        });
        // View에 모델 설정
        this.getView().setModel(oModel, "myModel");

        // 테이블에 받을 모델
        var oTableModel = new sap.ui.model.json.JSONModel({
          items: [],
        });
        this.getView().setModel(oTableModel, "tableModel");
      },

      onValueHelpMatId: function () {
        const oView = this.getView();
        const oModel = this.getView().getModel("myModel");

        oModel.read("/ZDCT_MM010Set", {
          success: function (oData) {
            // 전체 결과에서 필요한 것만 필터링
            const aFilteredResults = oData.results.filter(function (item) {
              return (
                item.MatTy === "ROH" ||
                item.MatTy === "VERP" ||
                item.MatTy === "DIEN"
              );
            });

            // 필터링된 결과를 JSONModel에 저장
            const oJsonModel = new sap.ui.model.json.JSONModel(
              aFilteredResults
            );
            oView.setModel(oJsonModel, "matHelpModel");

            if (!this._pValueHelpDialog) {
              this._pValueHelpDialog = sap.ui.core.Fragment.load({
                id: oView.getId(),
                name: "sync.dc.mm.project31.view.MaterialHelpDialog",
                controller: this,
              }).then(function (oDialog) {
                oView.addDependent(oDialog);
                return oDialog;
              });
            }

            this._pValueHelpDialog.then(function (oDialog) {
              oDialog.setModel(oView.getModel("matHelpModel"));
              oDialog.open();
            });
          }.bind(this),
          error: function () {
            sap.m.MessageToast.show("데이터 조회 실패");
          },
        });
      },

      onMaterialSearch: function (oEvent) {
        var sValue = oEvent.getParameter("value");

        var aFilters = [
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
        ];

        var oFilter = new sap.ui.model.Filter({
          filters: aFilters,
          and: false, // OR 조건
        });

        var oBinding = oEvent.getSource().getBinding("items");
        oBinding.filter([oFilter]);
      },

      _configValueHelpDialog: function () {
        var sInputValue = this.byId("productInput").getValue(),
          oModel = this.getView().getModel(),
          aProducts = oModel.getProperty("/ProductCollection");

        aProducts.forEach(function (oProduct) {
          oProduct.selected = oProduct.Name === sInputValue;
        });
        oModel.setProperty("/ProductCollection", aProducts);
      },

      // onValueHelpDialogClose: function (oEvent) {
      //   var oSelectedItem = oEvent.getParameter("selectedItem");

      //   if (oSelectedItem) {
      //     var sMatId = oSelectedItem.getTitle();

      //     // 모델에 matId 값 세팅 (default model 기준)
      //     this.getView().getModel().setProperty("/matId", sMatId);

      //     // 입력 필드에 직접 값 세팅
      //     this.byId("matIdInput").setValue(sMatId);
      //   }
      // },
      onValueHelpDialogClose: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("selectedItem");

        if (oSelectedItem) {
          var sMatId = oSelectedItem.getTitle();

          // 모델에 matId 값 세팅 (default model 기준)
          this.getView().getModel().setProperty("/matId", sMatId);

          // 입력 필드에 직접 값 세팅
          this.byId("matIdInput").setValue(sMatId);

          // === 단위 자동 지정 및 비활성화 로직 직접 호출 ===
          var oMatHelpModel = this.getView().getModel("matHelpModel");
          var aMatList = oMatHelpModel ? oMatHelpModel.getData() : [];
          var oSelectedMat = Array.isArray(aMatList)
            ? aMatList.find(function (item) {
                return item.MatId === sMatId;
              })
            : (aMatList.ZDCT_MM010Set || []).find(function (item) {
                return item.MatId === sMatId;
              });

          var oUomSelect = this.byId("uomSelect");
          if (oSelectedMat && oSelectedMat.BaseUnit) {
            oUomSelect.setSelectedKey(oSelectedMat.BaseUnit);
            oUomSelect.setEnabled(false);
          } else {
            oUomSelect.setEnabled(true);
          }
        }
      },

      // 구매요청 아이템 추가 버튼 클릭
      onAddPR: function () {
        var oView = this.getView();
        var oTableModel = oView.getModel("tableModel");
        var aItems = oTableModel.getProperty("/items") || [];

        var sPurGrpId = this.getView().byId("purGrpSelect").getSelectedKey();
        var sMatId = this.getView().byId("matIdInput").getValue();
        var sPlantId = this.getView().byId("plantIdSelect").getSelectedKey();
        var sPurId = this.getView().byId("purIdSelect").getSelectedKey();

        var sQty = this.getView().byId("qtyInput").getValue();
        var sUom = this.getView().byId("uomSelect").getSelectedKey(); // KGM, EA, LTR
        var uomDisp = this.getView()
          .byId("uomSelect")
          .getSelectedItem()
          .getText(); // KG, EA, L

        var sReqDelivDate = this.getView().byId("reqDelivDate").getValue();

        // 0. 모든 필수값 입력 여부 검사
        if (
          !sPurGrpId ||
          !sPlantId ||
          !sMatId ||
          !sPurId ||
          !sUom ||
          !sReqDelivDate ||
          !sQty
        ) {
          MessageBox.error("데이터를 모두 입력해주세요.");
          return;
        }

        // 수량이 0보다 작거나 같은지 체크
        if (parseFloat(sQty) <= 0) {
          MessageBox.error("수량은 0보다 커야 합니다.");
          return;
        }

        // 수량 1000 이하로만 구매 가능
        if (parseFloat(sQty) > 1000) {
          MessageBox.error("구매 가능 수량은 최대 1,000입니다.");
          return;
        }

        // 자재유형, 구매요청유형, 단위 체크를 위해 자재유형 조회
        // matHelpModel에서 선택한 자재의 MatTy, BaseUnit 가져오기 + 자재명 가져오기
        var oMatHelpModel = oView.getModel("matHelpModel");
        var aMatList = oMatHelpModel ? oMatHelpModel.getData() : [];
        var oSelectedMat = Array.isArray(aMatList)
          ? aMatList.find(function (item) {
              return item.MatId === sMatId;
            })
          : (aMatList.ZDCT_MM010Set || []).find(function (item) {
              return item.MatId === sMatId;
            });

        // 자재명 가져오기
        var sMatNm = oSelectedMat ? oSelectedMat.MatNm : "";

        if (!oSelectedMat) {
          MessageBox.error("유효하지 않은 자재번호입니다.");
          return;
        }

        var sMatTy = oSelectedMat.MatTy;
        var sBaseUnit = oSelectedMat.BaseUnit; // KGM, EA, LTR로 들어옴

        // 자재유형에 따른 구매요청유형 체크
        if (
          (sMatTy === "ROH" && sPurId !== "PRRM") ||
          (sMatTy === "VERP" && sPurId !== "PRPK") ||
          (sMatTy === "DIEN" && sPurId !== "PRSV")
        ) {
          MessageBox.error("자재에 맞는 구매요청 유형을 선택하세요.");
          return;
        }

        // 자재유형에 따른 단위 체크
        if (sUom !== sBaseUnit) {
          MessageBox.error("자재에 맞는 단위를 선택하세요.");
          return;
        }

        var sReqDelivDate = this.getView().byId("reqDelivDate").getValue();

        // 날짜 형식 체크 (yyyy-MM-dd)
        var dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(sReqDelivDate)) {
          MessageBox.error("납기요청일은 yyyy-MM-dd 형식으로 입력해야 합니다.");
          return;
        }

        // 날짜 객체로 변환 후 유효한 날짜인지 체크
        var oReqDate = new Date(sReqDelivDate);
        if (isNaN(oReqDate.getTime())) {
          MessageBox.error("납기요청일이 올바른 날짜가 아닙니다.");
          return;
        }

        // 5. 납기요청일이 오늘 이후인지 체크
        var oToday = new Date();
        oToday.setHours(0, 0, 0, 0);
        var oReqDate = new Date(sReqDelivDate);
        oReqDate.setHours(0, 0, 0, 0);

        if (oReqDate <= oToday) {
          MessageBox.error("납기요청일은 오늘 이후여야 합니다.");
          return;
        }

        // 1년(365일) 초과 불가 체크 추가
        var diffDays = (oReqDate - oToday) / (1000 * 60 * 60 * 24);
        if (diffDays > 365) {
          MessageBox.error(
            "납기요청일은 오늘로부터 1년(365일) 이내여야 합니다."
          );
          return;
        }

        // 동일한 데이터가 이미 있는지 검사하기
        var bDuplicate = aItems.some(function (item) {
          return (
            item.purGrpId === sPurGrpId &&
            item.matId === sMatId &&
            item.plantId === sPlantId &&
            item.purId === sPurId &&
            item.qty === sQty &&
            item.uom === sUom &&
            item.reqDelivDate === sReqDelivDate
          );
        });
        if (bDuplicate) {
          MessageBox.error("이미 추가된 구매요청입니다.");
          return;
        }

        // 모든 유효성 검사 통과 시
        MessageToast.show("구매요청을 추가합니다.");

        // 새 아이템 추가
        aItems.push({
          purGrpId: sPurGrpId,
          matId: sMatId,
          matNm: sMatNm, // 자재명 추가
          plantId: sPlantId,
          purId: sPurId,
          qty: sQty,
          uom: sUom, // KGM, EA, LTR
          uomDisp: uomDisp, // KG, EA, L
          reqDelivDate: sReqDelivDate,
        });

        oTableModel.setProperty("/items", aItems);
      },

      onResetForm: function () {
        // 구매요청 폼 초기화
        this.getView().byId("purGrpSelect").setSelectedKey("");
        this.getView().byId("matIdInput").setValue("");
        this.getView().byId("plantIdSelect").setSelectedKey("");
        this.getView().byId("purIdSelect").setSelectedKey("");
        this.getView().byId("qtyInput").setValue("");
        this.getView().byId("uomSelect").setSelectedKey("");
        this.getView().byId("reqDelivDate").setValue("");

        MessageToast.show("구매요청 폼을 초기화합니다.");
      },

      onResetPR: function () {
        // 테이블 모델 초기화
        var oTableModel = this.getView().getModel("tableModel");
        oTableModel.setProperty("/items", []);

        MessageToast.show("구매요청 리스트를 초기화합니다.");
      },

      onDeletePR: function () {
        // 구매요청 아이템 삭제
        var oTableModel = this.getView().getModel("tableModel");
        var aItems = oTableModel.getProperty("/items") || [];

        // 선택된 아이템의 인덱스 가져오기
        var oSelectedItem = this.byId("prTable").getSelectedItem();
        if (oSelectedItem) {
          var iIndex = oSelectedItem.getBindingContext("tableModel").getPath();
          iIndex = parseInt(iIndex.split("/").pop(), 10);
          aItems.splice(iIndex, 1);
          oTableModel.setProperty("/items", aItems);
        } else {
          MessageBox.error("삭제할 구매요청을 선택하세요.");
        }
      },

      onClearSelection: function () {
        // 테이블에서 선택된 아이템 해제
        this.byId("prTable").removeSelections(true);
        MessageToast.show("선택된 구매요청을 해제합니다.");
      },
      // 구매요청 생성 버튼 클릭
      onCreatePR: function () {
        var oTableModel = this.getView().getModel("tableModel");
        var aItems = oTableModel.getProperty("/items") || [];

        if (aItems.length === 0) {
          MessageBox.error("생성할 구매요청이 없습니다.");
          return;
        }

        var that = this;
        MessageBox.confirm("구매요청을 생성하시겠습니까?", {
          title: "구매요청 생성 확인",
          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
          emphasizedAction: MessageBox.Action.YES,
          onClose: function (oAction) {
            if (oAction === MessageBox.Action.YES) {
              that._doCreatePR(); // 실제 생성 로직 분리
            }
          },
        });
      },

      // 실제 생성 로직을 별도 함수로 분리
      _doCreatePR: function () {
        var oTableModel = this.getView().getModel("tableModel");
        var aItems = oTableModel.getProperty("/items") || [];
        var oModel = this.getView().getModel("myModel");
        var iSuccess = 0,
          iFail = 0;
        var that = this;
        var aPrIds = []; // 생성된 구매요청 번호 저장

        aItems.forEach(function (oItem, idx) {
          // 서버에 맞는 데이터 변환
          var oEntry = {
            // PrId, PrItemId, PoId, PoItemId는 서버에서 자동 생성
            PurGrpId: oItem.purGrpId,
            MatId: oItem.matId,
            PlantId: oItem.plantId,
            PurTy: oItem.purId,
            Qty: oItem.qty,
            Uom: oItem.uomDisp,
            ReqDelivDate: oItem.reqDelivDate + "T00:00:00", // 날짜 포맷 맞추기
            // CreatedBy, CreatedDate 등은 서버에서 자동 생성
          };

          oModel.create("/ZDCT_MM080Set", oEntry, {
            success: function (oData) {
              iSuccess++;
              if (oData && oData.PrId) {
                aPrIds.push(oData.PrId);
              }
              if (iSuccess + iFail === aItems.length) {
                MessageBox.success(
                  "구매요청이 " +
                    iSuccess +
                    "건 생성되었습니다.\n\n" +
                    (aPrIds.length > 0
                      ? "[생성된 구매요청 번호] : \n" + aPrIds.join(", ")
                      : "")
                );
                // 테이블 모델 초기화
                oTableModel.setProperty("/items", []);
                // 폼 초기화
                that.byId("purGrpSelect").setSelectedKey("");
                that.byId("matIdInput").setValue("");
                that.byId("plantIdSelect").setSelectedKey("");
                that.byId("purIdSelect").setSelectedKey("");
                that.byId("qtyInput").setValue("");
                that.byId("uomSelect").setSelectedKey("");
                that.byId("reqDelivDate").setValue("");
              }
            },
            error: function () {
              iFail++;
              if (iSuccess + iFail === aItems.length) {
                MessageBox.error("일부 구매요청 생성에 실패했습니다.");
                // 테이블 데이터 초기화
                oTableModel.setProperty("/items", []);
                // 폼 초기화
                that.byId("purGrpSelect").setSelectedKey("");
                that.byId("matIdInput").setValue("");
                that.byId("plantIdSelect").setSelectedKey("");
                that.byId("purIdSelect").setSelectedKey("");
                that.byId("qtyInput").setValue("");
                that.byId("uomSelect").setSelectedKey("");
                that.byId("reqDelivDate").setValue("");
              }
            },
          });
        });
      },
      // 설명 다이얼로그창 open
      onOpenInfoDialog: function (oEvent) {
        if (!this._oInfoDialog) {
          this._oInfoDialog = sap.ui.xmlfragment(
            "sync.dc.mm.project31.view.InfoDialog",
            this
          );
          this.getView().addDependent(this._oInfoDialog);
        }
        this._oInfoDialog.open();
      },

      onCloseInfoDialog: function () {
        if (this._oInfoDialog) {
          this._oInfoDialog.close();
        }
      },

      // 자재번호 입력 시 단위 자동 지정 및 비활성화
      onMatIdChange: function (oEvent) {
        var sMatId = oEvent.getSource().getValue().trim();
        // console.log("onMatIdChange", sMatId);

        var oMatHelpModel = this.getView().getModel("matHelpModel");
        var aMatList = oMatHelpModel ? oMatHelpModel.getData() : [];
        var oSelectedMat = Array.isArray(aMatList)
          ? aMatList.find(function (item) {
              return item.MatId === sMatId;
            })
          : (aMatList.ZDCT_MM010Set || []).find(function (item) {
              return item.MatId === sMatId;
            });

        var oUomSelect = this.byId("uomSelect");
        if (oSelectedMat && oSelectedMat.BaseUnit) {
          oUomSelect.setSelectedKey(oSelectedMat.BaseUnit);
          oUomSelect.setEnabled(false); // 단위 필드 비활성화
          // console.log("단위 자동 지정:", oSelectedMat.BaseUnit);
        } else {
          oUomSelect.setEnabled(true); // 자재가 없으면 다시 활성화
        }
      },
    });
  }
);
