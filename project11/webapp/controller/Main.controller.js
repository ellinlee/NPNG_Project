sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/ColorPalettePopover",
  "sap/ui/core/HTML"
  ], function (Controller, JSONModel, MessageBox, Filter, FilterOperator, ColorPalettePopover, HTML) {
    "use strict";

    return Controller.extend("sync.dc.sd.project11.controller.Main", {

      onInit: function () {
        var oSelected = new JSONModel({});
        this.getView().setModel(oSelected, "selectedModel");
  
        var oMaterialModel = new JSONModel();
oMaterialModel.loadData(sap.ui.require.toUrl("sync/dc/sd/project11/model/material.json"), null, false);
this.getView().setModel(oMaterialModel, "materialModel");
  
        this._oColorPopover = new ColorPalettePopover({
          showDefaultColor: false,
          showMoreColors: false,
          colorSelect: this._onColorSelect.bind(this)
        });
      },
  
      onSearchPress: function () {
        var aFilters = [],
            sInqrId   = this.byId("inqrIdInput").getValue(),
            sCustId   = this.byId("custIdInput").getValue(),
            sCustName = this.byId("custNameInput").getValue(),
            sMatId    = this.byId("matIdInput").getValue(),
            sSalesOrg = this.byId("salesOrgInput").getSelectedKey(),
            oFrom     = this.byId("dateFrom").getDateValue(),
            oTo       = this.byId("dateTo").getDateValue();
  
        if (sInqrId) {
          aFilters.push(new Filter("inqr_docu_id", FilterOperator.EQ, sInqrId));
        }
        if (sCustId) {
          aFilters.push(new Filter("cust_id", FilterOperator.EQ, sCustId));
        }
        if (sCustName) {
          aFilters.push(new Filter("cust_name", FilterOperator.Contains, sCustName));
        }
        if (sMatId) {
          aFilters.push(new Filter("mat_id", FilterOperator.EQ, sMatId)); 
        }
        if (sSalesOrg) {
          aFilters.push(new Filter("sales_org", FilterOperator.EQ, sSalesOrg));
        }
        if (oFrom && oTo) {
          aFilters.push(new Filter("valid_from", FilterOperator.BT, oFrom, oTo));
        }
  
        var oTable = this.byId("inquiryTable");
        oTable.unbindItems();
  
        var oTemplate = new sap.m.ColumnListItem({
          type: "Active",
          press: this.onSelect.bind(this),
          cells: [
            new sap.m.Text({ text: "{inqr_docu_id}" }),
            new sap.m.Text({ text: "{cust_id}" }),
            new sap.m.Text({ text: "{cust_name}" }),
            new sap.m.Text({ text: "{mat_id}" }),
            new sap.m.Text({ text: "{hdescr}" }),
            new sap.m.HBox({
              alignItems: "Center",
              items: [
                new sap.m.Text({
                  text: {
                    path: "sales_org",
                    formatter: this.countryFormatter
                  },
                  class: "sapUiTinyMarginEnd"
                }),
                new sap.m.Image({
                  src: {
                    path: "sales_org",
                    formatter: this.flagIconFormatter
                  },
                  decorative: false,
                  width: "1.5rem",
                  height: "1rem"
                })
              ]
            })
          ]
        });
  
        oTable.bindItems({
          path: "/ZDCC_InquiryForm",
          filters: aFilters,
          template: oTemplate
        });
  
        oTable.getBinding("items").attachEventOnce("dataReceived", function (oEvt) {
          var a = oEvt.getParameter("data").results;
          if (!a || !a.length) {
            MessageBox.information("검색 결과가 없습니다.");
          }
        });
      },
  
      onReset: function () {
        MessageBox.confirm("조회 조건과 결과를 초기화하시겠습니까?", {
          title: "초기화 확인",
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          emphasizedAction: MessageBox.Action.OK,
          onClose: function (sAction) {
            if (sAction === MessageBox.Action.OK) {
              this.byId("inqrIdInput").setValue("");
              this.byId("custIdInput").setValue("");
              this.byId("custNameInput").setValue("");
              this.byId("matIdInput").setValue("");
              this.byId("salesOrgInput").setSelectedKey("");
              this.byId("dateFrom").setValue("");
              this.byId("dateTo").setValue("");
              this.getView().getModel("selectedModel").setData({});
              this.byId("inquiryTable").unbindItems();
            }
          }.bind(this)
        });
      },
  
      onShowInfo: function () {
        MessageBox.information(
          "조회 조건 안내:\n\n" +
          "• 문의서번호: 정확히 일치해야 함 (최대 10자)\n" +
          "• 고객 ID: 정확히 일치해야 함 (최대 10자)\n" +
          "• 고객명: 일부값만 입력 가능\n" +
          "• 자재 ID: 정확히 일치해야 함 (최대 10자)\n" +
          "• 국가: 한국 / 일본 / 중국 선택\n" +
          "• 희망계약기간: 시작일~종료일 \n\n" +
          "조회 버튼 클릭 시, 조건에 맞는 문의서 목록이 표시됩니다.\n조건 미입력 시 전체 데이터가 출력됩니다."
        );
      },
  
      onSelect: function (oEvt) {
        var sInqrId = oEvt.getParameter("listItem").getBindingContext().getProperty("inqr_docu_id"),
            oODataModel = this.getView().getModel(),
            oSelectedModel = this.getView().getModel("selectedModel");
  
        oODataModel.read("/ZDCC_InquiryForm", {
          filters: [new Filter("inqr_docu_id", FilterOperator.EQ, sInqrId)],
          success: function (oData) {
            var aItems = oData.results;
            if (!aItems.length) {
              MessageBox.warning("해당 문의서의 자재 정보가 없습니다.");
              return;
            }
            oSelectedModel.setData({
              inqr_docu_id: aItems[0].inqr_docu_id,
              cust_id: aItems[0].cust_id,
              cust_name: aItems[0].cust_name,
              valid_from: aItems[0].valid_from,
              valid_to: aItems[0].valid_to,
              sales_org: aItems[0].sales_org,
              items: aItems
            });
            this.byId("detailDialog").open();
          }.bind(this),
          error: function () {
            MessageBox.error("상세 조회 중 오류가 발생했습니다.");
          }
        });
      },
  
      onDialogClose: function () {
        this.byId("detailDialog").close();
      },
  
      countryFormatter: function (s) {
        return { S100: "한국", S200: "일본", S300: "중국" }[s] || s;
      },
  
      flagIconFormatter: function (s) {
        return {
          S100: "https://flagcdn.com/w40/kr.png",
          S200: "https://flagcdn.com/w40/jp.png",
          S300: "https://flagcdn.com/w40/cn.png"
        }[s] || "";
      },
  
      domainText: function (sCode, sPrefix) {
        if (!sCode) return "";
        var oBundle = this.getView().getModel("i18n").getResourceBundle();
        return oBundle.getText(sPrefix + sCode);
      },
  
      unitFormatter: function (sUom) {
        return sUom ? sUom.charAt(0) : "";
      },
  
      getMaterialName: function (sMatID) {
        var sKey = String(sMatID);
        var oMat = this.getView().getModel("materialModel").getProperty("/" + sKey);
        return oMat ? oMat.name : "이름 없음";
      },
      
      getColorByMatID: function (sMatID) {
        var sKey = String(sMatID);
        var oMat = this.getView().getModel("materialModel").getProperty("/" + sKey);
        return oMat ? oMat.color : "#FFFFFF";
      },
  
      buildColorSwatch: function (sMatID) {
        var sColor = this.getColorByMatID(sMatID);
        var sName = this.getMaterialName(sMatID);
        return "<div title='" + sName + "' style='display:inline-block;width:60px;height:30px;margin:4px;background-color:" +
          sColor + ";border:1px solid #ccc;border-radius:6px;'></div>";
      },
  
      onColorPress: function (oEvt) {
        var aItems = this.getView().getModel("selectedModel").getProperty("/items") || [],
            aColors = aItems.map(function (o) {
              return this.getColorByMatID(o.mat_id).replace(/^#/, "");
            }.bind(this));
        this._oColorPopover.setColors(aColors);
        this._oColorPopover.setColumns(Math.min(aColors.length, 6));
        this._oColorPopover.openBy(oEvt.getSource());
      },
  
      _onColorSelect: function (oEvt) {
        var sColor = "#" + oEvt.getParameter("color");
        MessageBox.information("선택된 색: " + sColor);
      }
  
    });
  });