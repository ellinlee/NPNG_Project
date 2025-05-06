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
      // 상세 팝업 전용 JSON 모델
 var oSelected = new JSONModel({});
      this.getView().setModel(oSelected, "selectedModel");


    var oMaterialModel = new JSONModel({
      materials: [
        { MatID: "3000000000", ColorCode: "#FFECB3" },
        { MatID: "3000000001", ColorCode: "#616161" },
        { MatID: "3000000002", ColorCode: "#616161" },
        { MatID: "3000000003", ColorCode: "#E53935" },
        { MatID: "3000000004", ColorCode: "#9E9E9E" }
      ]
    });
    this.getView().setModel(oMaterialModel, "materialModel");

          // ColorPalettePopover 초기화
          this._oColorPopover = new ColorPalettePopover({
            showDefaultColor: false,
            showMoreColors:   false,
            colorSelect:      this._onColorSelect.bind(this)
          });
        },

            // MatID → ColorCode 포맷터
    getColorByMatID: function (sMatID) {
      var aMats = this.getView().getModel("materialModel").getProperty("/materials");
      var oMat = aMats.find(function(o){ return o.MatID === sMatID; });
      return oMat ? oMat.ColorCode : "#FFFFFF";
    },

    buildColorSwatch: function (sMatID) {
      var sColor = this.getColorByMatID(sMatID);
      return "<div style='display:inline-block;"
     + "width:60px;height:30px;margin:4px;"
     + "background-color:" + sColor + ";"
     + "border:1px solid #ccc;border-radius:6px;'></div>";

    },

    onSearchPress: function (oEvt) {
      var oSF      = oEvt.getSource().isA("sap.m.SearchField")
                     ? oEvt.getSource()
                     : this.byId("searchField"),
          sQuery   = oSF.getValue(),
          oTable   = this.byId("inquiryTable"),
          oBind    = oTable.getBinding("items"),
          aFilters = [];

      if (sQuery) {
        aFilters.push(new Filter({
          filters: [
            new Filter("inqr_docu_id", FilterOperator.Contains, sQuery),
            new Filter("mat_id",       FilterOperator.Contains, sQuery),
            new Filter("cust_id",      FilterOperator.Contains, sQuery)
          ],
          and: false
        }));
      }
      oBind.filter(aFilters);
      oBind.attachEventOnce("dataReceived", function (oEvt) {
        var a = oEvt.getParameter("data").results;
        if (!a || !a.length) {
          MessageBox.information("검색 결과가 없습니다.");
        }
      });
    },

    onReset: function () {
      this.byId("searchField").setValue("");
      this.byId("inquiryTable").getBinding("items").filter([]);
      this.getView().getModel("selectedModel").setData({});
    },

    onShowInfo: function () {
      MessageBox.information(
        "조회 가능 필드:\n" +
        "• 문의서번호 \n" +
        "• 자재ID     \n" +
        "• 고객ID      \n\n" +
        "돋보기 또는 '조회' 버튼으로 검색을 실행하세요.\n" +
        "리스트에서 행을 클릭하면 상세 팝업이 열립니다."
      );
    },

    onSelect: function (oEvt) {
      var sInqrId        = oEvt.getParameter("listItem")
                             .getBindingContext().getProperty("inqr_docu_id"),
          oODataModel    = this.getView().getModel(),         // default 모델
          oSelectedModel = this.getView().getModel("selectedModel");

      // 서버에서 해당 문의서번호 필터 전체 결과 조회
      oODataModel.read("/ZDCC_InquiryForm", {
        filters: [ new Filter("inqr_docu_id", FilterOperator.EQ, sInqrId) ],
        success: function (oData) {
          var aItems = oData.results;
          if (!aItems.length) {
            MessageBox.warning("해당 문의서의 자재 정보가 없습니다.");
            return;
          }
          oSelectedModel.setData({
            inqr_docu_id: aItems[0].inqr_docu_id,
            cust_id:      aItems[0].cust_id,
            cust_name:    aItems[0].cust_name,
            valid_from:   aItems[0].valid_from,
            valid_to:     aItems[0].valid_to,
            sales_org:    aItems[0].sales_org,
            items:        aItems
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
      return { S100:"한국", S200:"일본", S300:"중국" }[s] || s;
    },

    flagIconFormatter: function (s) {
      return {
        S100: "https://flagcdn.com/w40/kr.png",
        S200: "https://flagcdn.com/w40/jp.png",
        S300: "https://flagcdn.com/w40/cn.png"
      }[s] || "";
    },

  // 도메인 코드 → i18n 번들 텍스트 변환
  domainText: function (sCode, sPrefix) {
    if (!sCode) { return ""; }
    var oBundle = this.getView().getModel("i18n").getResourceBundle();
    return oBundle.getText(sPrefix + sCode);
  },

  // 단위 포맷터: "LTR" → "L"
  unitFormatter: function (sUom) {
    return sUom ? sUom.charAt(0) : "";
  },
    // 테이블의 컬러 버튼 클릭 시 팝업 열기
    onColorPress: function (oEvt) {
      // 팝업용 컬러 배열: items 모델에서 mat_id로 ColorCode 꺼내기
      var aItems  = this.getView().getModel("selectedModel").getProperty("/items") || [],
          aColors = aItems.map(function(o){
            return this.getColorByMatID(o.mat_id).replace(/^#/,"");
          }.bind(this));
      this._oColorPopover.setColors(aColors);
      this._oColorPopover.setColumns(Math.min(aColors.length, 6));
      this._oColorPopover.openBy(oEvt.getSource());
    },

    // 팝업에서 색 선택 시
    _onColorSelect: function (oEvt) {
      var sColor = "#" + oEvt.getParameter("color");
      MessageBox.information("선택된 색: " + sColor);
    }

  });
});